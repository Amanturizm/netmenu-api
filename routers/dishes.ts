import express from 'express';
import Dish from '../models/Dish';
import auth from '../middleware/auth';
import { filesUpload } from '../s3';
import { IDish, IMenu } from '../types';
import mongoose from 'mongoose';
import Category from '../models/Category';

const dishesRouter = express.Router();

dishesRouter.get('/search/:menu_id', auth, async (req, res) => {
  try {
    const menu_id = req.params.menu_id as string;
    const query = req.query.query as string;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const categories = await Category.find({ menu: menu_id }).select('_id');
    const categoryIds = categories.map((category) => category._id);

    const dishes = await Dish.find({
      category: { $in: categoryIds },
      name: { $regex: query, $options: 'i' },
    });

    return res.send(dishes);
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }
});

dishesRouter.get('/:categoryId', auth, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const dishes = await Dish.find({ category: categoryId });

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

dishesRouter.put('/:id', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const dishId = req.params.id;
    const body = req.body as IMenu;
    const file = req.file as (File & { key: string }) | undefined;

    const updatedData = {
      ...body,
    };

    if (file) {
      updatedData.image = file.key;
    }

    const dish = await Dish.findByIdAndUpdate(dishId, updatedData, { new: true });

    if (!dish) {
      return res.sendStatus(404).send({ error: 'This dish not found!' });
    }

    await dish.save();

    return res.send(dish);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(400).send(e);
    }

    return next(e);
  }
});

export default dishesRouter;
