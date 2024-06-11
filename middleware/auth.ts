import { NextFunction, Request, Response } from 'express';
import { HydratedDocument } from 'mongoose';
import User from '../models/User';
import { IUser } from '../types';

export interface RequestWithUser extends Request {
  user: HydratedDocument<IUser>;
}

const auth = async (expressReq: Request, res: Response, next: NextFunction) => {
  const req = expressReq as RequestWithUser;

  const token = req.get('Authorization');

  if (!token) {
    return res.status(400).send({ error: 'No token!' });
  }

  const user = (await User.findOne({ token })) as HydratedDocument<IUser>;

  if (!user) {
    return res.status(400).send({ error: 'Incorrect token!' });
  }

  req.user = user;

  next();
};

export default auth;
