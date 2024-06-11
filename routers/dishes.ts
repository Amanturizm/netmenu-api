import express from 'express';
import Dish from '../models/Dish';
import auth from '../middleware/auth';
import { filesUpload } from '../multer';
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

dishesRouter.post('/:categoryId', auth, filesUpload.single('image'), async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const body = req.body as IDish;
    const file = req.file;

    const dish = await Dish.create({
      category: categoryId,
      name: body.name,
      image: file ? file.filename.split('.').pop() + '/' + file.filename : null,
      weight: body.weight,
      description: body.description,
      preparationTime: body.preparationTime,
      calories: body.calories,
      price: body.price,
      newPrice: body.newPrice,
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
    const file = req.file;

    const updatedData = {
      ...body,
    };

    if (file) {
      updatedData.image = file.filename.split('.').pop() + '/' + file.filename;
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
