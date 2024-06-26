import mongoose, { CallbackError, Schema } from 'mongoose';
import Menu from './Menu';
import { ICategory, TObjectId } from '../types';
import { deletePrevImage } from '../s3';
import Dish from './Dish';

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

CategorySchema.pre('deleteMany', async function (next) {
  try {
    const conditions = (this as unknown as { _conditions: { menu: TObjectId } })._conditions;
    const categories = (await Category.find(conditions).lean()) as ICategory[];
    await Promise.all(
      categories.map(async (category) => {
        await Dish.deleteMany({ category: category._id });
        void deletePrevImage(category.image);
      }),
    );
    next();
  } catch (e) {
    next(e as CallbackError);
  }
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;
