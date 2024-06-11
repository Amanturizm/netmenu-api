import express from 'express';
import auth from '../middleware/auth';
import Category from '../models/Category';
import { filesUpload } from '../multer';
import { ICategory } from '../types';
import mongoose from 'mongoose';

const categoriesRouter = express.Router();

categoriesRouter.get('/:menuId', auth, async (req, res) => {
  try {
    const menuId = req.params.menuId as string;
    const groupName = req.query.groupName as string;
    const onlyLength = req.query.onlyLength as string;

    const filter = {
      menu: menuId,
    } as { menu: string; groupName?: string };

    if (groupName) {
      filter.groupName = groupName;
    }

    if (onlyLength === 'true') {
      const categoriesLength = await Category.countDocuments(filter);
      return res.send(categoriesLength.toString());
    }

    const categories = await Category.find(filter);

    return res.send(categories);
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }
});

categoriesRouter.post('/:menuId', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const menuId = req.params.menuId;
    const body = req.body as ICategory;
    const file = req.file;

    const category = await Category.create({
      menu: menuId,
      groupName: body.groupName,
      name: body.name,
      image: file ? file.filename.split('.').pop() + '/' + file.filename : null,
    });

    await category.save();

    return res.sendStatus(201);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

export default categoriesRouter;
