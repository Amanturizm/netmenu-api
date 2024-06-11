import mongoose, { Schema } from 'mongoose';
import User from './User';
import { IMenu, TObjectId } from '../types';

const MenuSchema = new Schema<IMenu>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async (value: TObjectId) => User.findById(value),
      message: 'User does not exist!',
    },
  },
  name: {
    type: String,
  },
  image: {
    type: String,
  },
  address: {
    type: String,
  },
  wifiName: {
    type: String,
  },
  wifiPassword: {
    type: String,
  },
});

const Menu = mongoose.model('Menu', MenuSchema);

export default Menu;
