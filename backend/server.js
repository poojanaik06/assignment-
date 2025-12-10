import dotenv from 'dotenv';
dotenv.config(); // MUST be first so routes see process.env

import express from 'express';
import cors from 'cors';
import generateImageRoute from './routes/generateImage.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(generateImageRoute);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});