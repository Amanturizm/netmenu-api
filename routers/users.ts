import express from 'express';
import mongoose, { HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import auth, { RequestWithUser } from '../middleware/auth';
import User, { IUserMethods } from '../models/User';

const usersRouter = express.Router();

usersRouter.post('/', async (req, res, next) => {
  try {
    const user = new User({
      email: req.body.email,
      password: req.body.password,
    });

    user.generateToken();

    await user.save();
    return res.send(user);
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
      username: req.body.email,
    })) as HydratedDocument<IUserMethods>;

    if (!user) {
      return res.status(400).send({ error: 'Wrong username or password!' });
    }

    // ToDo: Removed
    console.log(user);

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      return res.status(400).send({ error: 'Wrong username or password!' });
    }

    user.generateToken();
    await user.save();

    return res.send({ message: 'Username and password correct!', user });
  } catch (e) {
    return next(e);
  }
});

usersRouter.delete('/sessions', auth, async (req, res, next) => {
  try {
    const { _id } = (req as RequestWithUser).user;

    const user = (await User.findById(_id)) as HydratedDocument<IUserMethods>;

    user.generateToken();
    await user.save();
    return res.send({ message: 'User token changed!' });
  } catch (e) {
    return next(e);
  }
});

export default usersRouter;
