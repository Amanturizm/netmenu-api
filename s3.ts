import path from 'path';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { randomUUID } from 'crypto';
import config from './config';

const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export const filesUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.aws.s3Bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
});

export const deletePrevImage = async (key: string) => {
  try {
    const deleteParams = {
      Bucket: config.aws.s3Bucket,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    return { message: `Deleted ${key}` };
  } catch (error) {
    return { error };
  }
};
