import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { profile } from 'console';


const PORT = process.env.PORT || 5000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/user', profileRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Premier League Predictor API');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});