import express from 'express';
import mongoose, { HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import nodemailer from 'nodemailer';
import auth, { RequestWithUser } from '../middleware/auth';
import User, { IUserMethods } from '../models/User';
import config from '../config';
import { deletePrevImage, filesUpload } from '../s3';

const usersRouter = express.Router();

usersRouter.post('/', async (req, res, next) => {
  try {
    const user = new User({
      email: req.body.email,
      password: req.body.password,
    }) as HydratedDocument<IUserMethods>;

    user.generateToken();

    await user.save();
    return res.status(201).send(user);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

usersRouter.post('/sessions', async (req, res, next) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ error: 'email or password field is required' });
    }

    const user = (await User.findOne({
      email: req.body.email,
    })) as HydratedDocument<IUserMethods>;

    if (!user) {
      return res.status(400).send({ error: 'Wrong username or password!' });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      return res.status(400).send({ error: 'Wrong username or password!' });
    }

    user.generateToken();
    await user.save();

    return res.send(user);
  } catch (e) {
    return next(e);
  }
});

usersRouter.delete('/sessions', auth, async (req, res, next) => {
  try {
    const user = (req as RequestWithUser).user as HydratedDocument<IUserMethods>;

    user.generateToken();
    await user.save();
    return res.sendStatus(204);
  } catch (e) {
    return next(e);
  }
});

usersRouter.post('/password-reset', async (req, res, next) => {
  try {
    if (!req.body.email) {
      return res.status(400).send({ error: 'email field is required!' });
    }

    const user = (await User.findOne({
      email: req.body.email,
    })) as HydratedDocument<IUserMethods>;

    if (!user) {
      return res.status(404).send({ error: 'This email not found!' });
    }

    const generatedPassword = crypto
      .randomBytes(8)
      .toString('base64')
      .slice(0, 8)
      .replace(/[^a-zA-Z0-9]/g, '');

    user.password = generatedPassword;

    user.generateToken();
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: config.auth,
    });

    transporter.sendMail(
      {
        from: `Netmenu <${config.auth.user}>`,
        to: user.email,
        subject: 'QR Netmenu',
        text: 'Ваш новый пароль: ' + generatedPassword,
      },
      (err) => {
        if (err) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    );

    return res.sendStatus(204);
  } catch (e) {
    return next(e);
  }
});

usersRouter.patch('/', auth, filesUpload.single('adImage'), async (req, res, next) => {
  try {
    const user = (req as RequestWithUser).user as HydratedDocument<IUserMethods>;

    const username = req.body.username ?? user.username;
    const email = req.body.email || user.email;

    user.username = username;
    user.email = email;

    const newPassword = req.body.newPassword;

    if (newPassword && newPassword.length > 8) {
      user.password = newPassword;
    }

    const file = req.file as (File & { key: string }) | undefined;

    if (file || (req.body.adImage && req.body.adImage === 'delete')) {
      if (user.adImage) {
        void deletePrevImage(user.adImage);
      }
      user.adImage = req.body.adImage ? null : file ? file.key : null;
    }

    user.generateToken();
    await user.save();

    return res.send(user);
  } catch (e) {
    return next(e);
  }
});

export default usersRouter;
