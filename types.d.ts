import mongoose from 'mongoose';

export type TObjectId = mongoose.Schema.Types.ObjectId;

export interface IUser {
  _id?: TObjectId;
  username?: string;
  email: string;
  password: string;
  token: string;
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
  image: string;
  weight: string;
  description: string;
  preparationTime: number;
  calories: ICalories;
  price: number;
  newPrice: number | null;
}

interface ICalories {
  total: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}
