import mongoose, { Schema } from 'mongoose';
import Menu from './Menu';
import { ICategory, TObjectId } from '../types';

const CategorySchema = new Schema<ICategory>({
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true,
    validate: {
      validator: async (value: TObjectId) => Menu.findById(value),
      message: 'Menu does not exist!',
    },
  },
  groupName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;
