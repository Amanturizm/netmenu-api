import express from 'express';
import auth, { RequestWithUser } from '../middleware/auth';
import Category from '../models/Category';
import { deletePrevImage, filesUpload } from '../s3';
import { ICategory, IMenu, TObjectId } from '../types';
import mongoose, { HydratedDocument } from 'mongoose';
import Dish from '../models/Dish';

const categoriesRouter = express.Router();

categoriesRouter.get('/menu/:id', auth, async (req, res) => {
  try {
    const menuId = req.params.id as string;
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

    const categories = await Category.find(filter).lean();

    return res.send(categories);
  } catch (e) {
    return res.sendStatus(500);
  }
});

categoriesRouter.get('/:id', auth, async (req, res) => {
  try {
    const categoryId = req.params.id as string;

    const category = await Category.findById(categoryId).lean();

    return res.send(category);
  } catch (e) {
    return res.sendStatus(500);
  }
});

categoriesRouter.post('/:menuId', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const menuId = req.params.menuId;
    const body = req.body as ICategory;
    const file = req.file as (File & { key: string }) | undefined;

    const category = await Category.create({
      menu: menuId,
      groupName: body.groupName,
      name: body.name,
      image: file ? file.key : null,
    });

    await category.save();

    return res.status(201).send(category);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

categoriesRouter.patch('/:id', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const body = req.body as ICategory;
    const file = req.file as (File & { key: string }) | undefined;

    const updatedData = {
      ...body,
    };

    if (file) {
      updatedData.image = file.key;
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.sendStatus(404).send({ error: 'This category not found!' });
    }

    const prevImage = category.image;

    const keys = Object.keys(updatedData) as Array<keyof ICategory>;
    keys.forEach((key) => {
      category[key] = updatedData[key] as TObjectId & string;
    });

    await category.save();

    if (file && prevImage) {
      void deletePrevImage(prevImage);
    }

    return res.send(category);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

categoriesRouter.delete('/:id', auth, async (req, res, next) => {
  try {
    const user = (req as RequestWithUser).user;
    const categoryId = req.params.id;

    const category = (await Category.findById(categoryId).populate(
      'menu',
    )) as unknown as HydratedDocument<ICategory & { menu: IMenu }>;

    if (!category) {
      return res.status(404).send('No category found with id ' + categoryId);
    }

    if (category.menu.user.toString() !== user._id.toString()) {
      return res
        .status(400)
        .send('This category does not apply to this user ' + `(${user.username})`);
    }

    const image = category.image;

    await Dish.deleteMany({ category: category._id });
    await category.deleteOne();

    if (image) {
      void deletePrevImage(image);
    }

    return res.sendStatus(204);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

export default categoriesRouter;
