import 'dotenv/config';
import express from 'express';
import recommendApp from './api/recommend.js';

const app = express();
app.use('/api/recommend', recommendApp);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api/recommend`));
