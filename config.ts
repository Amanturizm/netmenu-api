import path from 'path';
import { config as configDotenv } from 'dotenv';

const rootPath = __dirname;

configDotenv();

const config = {
  rootPath,
  publicPath: path.join(rootPath, 'public'),
  db: `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`,
  auth: {
    user: process.env.TRANSPORT_AUTH_USER,
    pass: process.env.TRANSPORT_AUTH_PASS,
  },
};

export default config;
