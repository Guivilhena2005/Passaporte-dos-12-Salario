import express from 'express';
import backend from './server/index.js';

const app = express();

app.use(backend);

export default app;