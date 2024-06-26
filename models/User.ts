import { HydratedDocument, Model, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../types';
import { randomUUID } from 'crypto';

const SALT_WORK_FACTORS = 10;

export interface IUserMethods extends IUser {
  generateToken(): void;
}

type UserModel = Model<IUser, object, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: async function (this: HydratedDocument<IUser>, email: string): Promise<boolean> {
        if (!this.isModified('email')) return true;
        const user: HydratedDocument<IUser> | null = await User.findOne({
          email,
        });
        return !user;
      },
      message: 'This user is already registered',
    },
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: null,
  },
  adImage: {
    type: String,
    default: null,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(SALT_WORK_FACTORS);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;

    return ret;
  },
});

UserSchema.methods.generateToken = function () {
  this.token = randomUUID();
};

const User = model('User', UserSchema);

export default User;
