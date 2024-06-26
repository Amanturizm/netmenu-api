import mongoose from 'mongoose';

export type TObjectId = mongoose.Schema.Types.ObjectId;

export interface IUser {
  _id?: TObjectId;
  email: string;
  password: string;
  token: string;
  username: string | null;
  adImage: string | null;
}

export interface IMenu {
  _id?: TObjectId;
  user: TObjectId;
  name: string;
  image: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
}

export interface ICategory {
  _id?: TObjectId;
  menu: TObjectId;
  groupName: string;
  name: string;
  image: string;
}

export interface IDish {
  _id?: TObjectId;
  category: TObjectId;
  name: string;
  weight: number;
  price: number;
  oldPrice: number | null;
  calories: number;
  proteinAndFatAndCarbohydrates: string;
  preparationTime: number;
  description: string;
  image: string;
}
