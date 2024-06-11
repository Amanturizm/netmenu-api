import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config';
import usersRouter from './routers/users';
import menusRouter from './routers/menus';
import categoriesRouter from './routers/categories';
import dishesRouter from './routers/dishes';

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/users', usersRouter);
app.use('/menus', menusRouter);
app.use('/categories', categoriesRouter);
app.use('/dishes', dishesRouter);

app.get('*', (_, res) => res.sendStatus(404));

(async () => {
  await mongoose.connect(config.db);

  app.listen(port, () => console.log(`Server running at ${port} port...`));

  process.on('exit', () => {
    mongoose.disconnect();
  });
})().catch((e) => console.error(e));

export default app;
