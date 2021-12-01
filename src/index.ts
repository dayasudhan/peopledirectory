import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import mongoose from 'mongoose';

import { router } from "./routes/people";
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';
const app = express();
app.use(json());
app.use(router)
const PORT = 3000; // default port to listen

app.all('*', async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/people', {

      });
      console.log('Connected to MongoDb');
    } catch (err) {
      console.error(err);
    }
  
    app.listen(PORT, () => {
      console.log('Listening on port 3000!!!!!!!!');
    });
  };
  
  start();

