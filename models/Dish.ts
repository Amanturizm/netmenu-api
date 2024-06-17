import mongoose, { Schema } from 'mongoose';
import { IDish, TObjectId } from '../types';
import Category from './Category';

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
  weight: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  oldPrice: {
    type: Number,
    default: null,
  },
  calories: {
    type: Number,
    required: true,
  },
  proteinAndFatAndCarbohydrates: {
    type: String,
    required: true,
  },
  preparationTime: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const Dish = mongoose.model('Dish', DishSchema);

export default Dish;
