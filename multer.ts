import multer from 'multer';
import path from 'path';
import config from './config';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

const storage = multer.diskStorage({
  destination: async (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const destDir = path.join(config.publicPath, ext.split('.').pop() + '');
    await fs.mkdir(destDir, { recursive: true });
    cb(null, destDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, randomUUID() + ext);
  },
});

export const filesUpload = multer({ storage });
