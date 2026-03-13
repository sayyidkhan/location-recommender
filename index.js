import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import recommendApp from './api/recommend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use('/api/recommend', recommendApp);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

export default app;
