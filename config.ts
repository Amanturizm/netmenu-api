import path from 'path';
import { config as configDotenv } from 'dotenv';

const rootPath = __dirname;

configDotenv();

const config = {
  rootPath,
  publicPath: path.join(rootPath, 'public'),
  db: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_NAME}.kjnqlnz.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`,
  auth: {
    user: process.env.TRANSPORT_AUTH_USER,
    pass: process.env.TRANSPORT_AUTH_PASS,
  },
};

export default config;
