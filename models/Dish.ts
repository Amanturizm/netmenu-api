import mongoose, { Schema } from 'mongoose';
import { ICalories, IDish, TObjectId } from '../types';
import Category from './Category';

const CaloriesSchema = new Schema<ICalories>({
  total: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    required: true,
  },
  fat: {
    type: Number,
    required: true,
  },
  carbohydrates: {
    type: Number,
    required: true,
  },
});

const DishSchema = new Schema<IDish>({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    validate: {
      validator: async (value: TObjectId) => Category.findById(value),
      message: 'Category does not exist!',
    },
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  weight: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  preparationTime: {
    type: Number,
    required: true,
  },
  calories: {
    type: CaloriesSchema,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  newPrice: {
    type: Number,
  },
});

const Dish = mongoose.model('Dish', DishSchema);

export default Dish;
