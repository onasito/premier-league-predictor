import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import matchRoutes, { syncFinishedMatches } from './routes/matchRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import standingsRoutes, { warmStandingsCache } from './routes/standingsRoutes.js';


const PORT = process.env.PORT || 5000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/user', profileRoutes);
app.use('/matches', matchRoutes);
app.use('/predictions', predictionRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/standings', standingsRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Premier League Predictor API');
});

const SYNC_INTERVAL_MS = 30 * 60 * 1000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    warmStandingsCache();
    syncFinishedMatches();
    setInterval(syncFinishedMatches, SYNC_INTERVAL_MS);
});