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
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    region: process.env.AWS_REGION as string,
    s3Bucket: process.env.AWS_S3_BUCKET as string,
  },
};

export default config;
