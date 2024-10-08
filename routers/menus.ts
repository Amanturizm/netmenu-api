import express from 'express';
import mongoose, { HydratedDocument } from 'mongoose';
import auth, { RequestWithUser } from '../middleware/auth';
import { deletePrevImage, filesUpload, saveQRCode } from '../s3';
import Menu from '../models/Menu';
import { IMenu, TObjectId } from '../types';
import Category from '../models/Category';

const menusRouter = express.Router();

menusRouter.get('/', auth, async (req, res) => {
  try {
    const user = (req as RequestWithUser).user;

    const menus = await Menu.find({ user: user._id }).select('name image').lean();

    return res.send(menus);
  } catch {
    return res.sendStatus(500);
  }
});

menusRouter.get('/:id', auth, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).lean();

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

    const qrCode = await saveQRCode(`https://www.netmenu.kz/menu/${menu._id}?groupName=Еда`);

    if (qrCode.key) {
      menu.qrCodeImage = qrCode.key;
    }

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
    const file = req.file as (File & { key: string }) | undefined;

    const updatedData = {
      ...body,
    };

    if (file) {
      updatedData.image = file.key;
    }

    const menu = (await Menu.findById(menuId)) as HydratedDocument<IMenu>;

    if (!menu) {
      return res.sendStatus(404).send({ error: 'This menu not found!' });
    }

    const prevImage = menu.image;

    const keys = Object.keys(updatedData) as Array<keyof IMenu>;
    keys.forEach((key) => {
      menu[key] = updatedData[key] as TObjectId & string;
    });

    await menu.save();

    if (file && prevImage) {
      await deletePrevImage(prevImage);
    }

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

    const image = menu.image;
    const qrCodeImage = menu.qrCodeImage;

    await Category.deleteMany({ menu: menu._id });
    await menu.deleteOne();

    if (image) {
      await deletePrevImage(image);
    }

    if (qrCodeImage) {
      await deletePrevImage(qrCodeImage);
    }

    return res.sendStatus(204);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

export default menusRouter;
