import express from 'express';
import Dish from '../models/Dish';
import auth, { RequestWithUser } from '../middleware/auth';
import { deletePrevImage, filesUpload } from '../s3';
import { ICategory, IDish, IMenu } from '../types';
import mongoose, { HydratedDocument } from 'mongoose';
import Category from '../models/Category';

const dishesRouter = express.Router();

dishesRouter.get('/search/:menu_id', auth, async (req, res) => {
  try {
    const menu_id = req.params.menu_id as string;
    const query = req.query.query as string;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const categories = (await Category.find({ menu: menu_id }).select('_id').lean()) as ICategory[];
    const categoryIds = categories.map((category) => category._id);

    const dishes = await Dish.find({
      category: { $in: categoryIds },
      name: { $regex: query, $options: 'i' },
    }).lean();

    return res.send(dishes);
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }
});

dishesRouter.get('/:categoryId', auth, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const dishes = await Dish.find({ category: categoryId }).lean();

    return res.send(dishes);
  } catch {
    return res.sendStatus(500);
  }
});

dishesRouter.post('/', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const body = req.body as IDish;
    const file = req.file as (File & { key: string }) | undefined;

    const dish = await Dish.create({
      category: body.category,
      name: body.name,
      weight: body.weight,
      price: body.price,
      oldPrice: body.oldPrice || null,
      calories: body.calories,
      proteinAndFatAndCarbohydrates: body.proteinAndFatAndCarbohydrates,
      preparationTime: body.preparationTime,
      description: body.description,
      image: file ? file.key : null,
    });

    await dish.save();

    return res.sendStatus(201);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

dishesRouter.patch('/:id', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const dishId = req.params.id;
    const body = req.body as IDish;
    const file = req.file as (File & { key: string }) | undefined;

    const updatedData = {
      ...body,
    };

    if (file) {
      updatedData.image = file.key;
    }

    const dish = await Dish.findById(dishId);

    if (!dish) {
      return res.sendStatus(404).send({ error: 'This dish not found!' });
    }

    const prevImage = dish.image;

    const keys = Object.keys(updatedData) as Array<keyof IDish>;
    keys.forEach((key) => {
      dish[key] = updatedData[key] as never;
    });

    await dish.save();

    if (file && prevImage) {
      void deletePrevImage(prevImage);
    }

    return res.send(dish);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

dishesRouter.delete('/:id', auth, async (req, res, next) => {
  try {
    const user = (req as RequestWithUser).user;
    const dishId = req.params.id;

    const dish = (await Dish.findById(dishId).populate({
      path: 'category',
      select: 'menu',
      populate: { path: 'menu', select: 'user' },
    })) as unknown as HydratedDocument<IDish & { category: { menu: IMenu } }>;

    if (!dish) {
      return res.status(404).send('No dish found with id ' + dishId);
    }

    if (dish.category.menu.user.toString() !== user._id.toString()) {
      return res.status(400).send('This dish does not apply to this user ' + `(${user.username})`);
    }

    const image = dish.image;

    await dish.deleteOne();

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

export default dishesRouter;
