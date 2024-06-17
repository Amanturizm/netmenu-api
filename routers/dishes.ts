import express from 'express';
import Dish from '../models/Dish';
import auth from '../middleware/auth';
import { filesUpload } from '../s3';
import { IDish, IMenu } from '../types';
import mongoose from 'mongoose';

const dishesRouter = express.Router();

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
