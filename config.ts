import path from 'path';
import { config as configDotenv } from 'dotenv';

const rootPath = __dirname;

configDotenv();

const config = {
  rootPath,
  publicPath: path.join(rootPath, 'public'),
  db: `${process.env.DB_URI}`,
  auth: {
    user: process.env.TRANSPORT_AUTH_USER,
    pass: process.env.TRANSPORT_AUTH_PASS,
  },
};

export default config;
