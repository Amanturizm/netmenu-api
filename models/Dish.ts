import mongoose, { CallbackError, Schema } from 'mongoose';
import { IDish, TObjectId } from '../types';
import Category from './Category';
import { deletePrevImage } from '../s3';

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

DishSchema.pre('deleteMany', async function (next) {
  try {
    const conditions = (this as unknown as { _conditions: { category: TObjectId } })._conditions;
    const dishes = (await Dish.find(conditions).lean()) as IDish[];
    dishes.forEach((dish) => {
      deletePrevImage(dish.image);
    });
    next();
  } catch (e) {
    next(e as CallbackError);
  }
});

const Dish = mongoose.model('Dish', DishSchema);

export default Dish;
