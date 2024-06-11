import express from 'express';
import mongoose, { HydratedDocument } from 'mongoose';
import auth, { RequestWithUser } from '../middleware/auth';
import { IMenu } from '../types';
import { filesUpload } from '../multer';
import Menu from '../models/Menu';

const menusRouter = express.Router();

menusRouter.get('/', auth, async (req, res) => {
  try {
    const user = (req as RequestWithUser).user;

    const menus = await Menu.find({ user: user._id }).select('name image');

    return res.send(menus);
  } catch {
    return res.sendStatus(500);
  }
});

menusRouter.get('/:id', auth, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).send('No menu found with id ' + req.params.id);
    }

    return res.send(menu);
  } catch {
    return res.sendStatus(500);
  }
});

menusRouter.post('/', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const user = (req as RequestWithUser).user;
    const body = req.body as IMenu;
    const file = req.file;

    const menu = (await Menu.create({
      user: user._id,
      name: body.name || '',
      image: file ? file.filename.split('.').pop() + '/' + file.filename : null,
      address: body.address || '',
      wifiName: body.wifiName || '',
      wifiPassword: body.wifiPassword || '',
    })) as HydratedDocument<IMenu>;

    await menu.save();

    return res.status(201).send(menu);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

menusRouter.patch('/:id', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const menuId = req.params.id;
    const body = req.body as IMenu;
    const file = req.file;

    const updatedData = {
      ...body,
    };

    if (file) {
      updatedData.image = file.filename.split('.').pop() + '/' + file.filename;
    }

    const menu = await Menu.findByIdAndUpdate(menuId, updatedData, { new: true });

    if (!menu) {
      return res.sendStatus(404).send({ error: 'This menu not found!' });
    }

    await menu.save();

    return res.send(updatedData);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

menusRouter.delete('/:id', auth, async (req, res, next) => {
  try {
    const user = (req as RequestWithUser).user;
    const menuId = req.params.id;

    const menu = (await Menu.findById(menuId)) as HydratedDocument<IMenu>;

    if (!menu) {
      return res.status(404).send('No menu found with id ' + req.params.id);
    }

    if (menu.user.toString() !== user._id.toString()) {
      return res.status(400).send('This menu does not apply to this user ' + `(${user.username})`);
    }

    await menu.deleteOne();

    return res.sendStatus(204);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

export default menusRouter;
