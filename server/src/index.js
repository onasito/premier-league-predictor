import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import cors from 'cors';
import axios from 'axios';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import matchRoutes, { syncFinishedMatches } from './routes/matchRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import standingsRoutes, { warmStandingsCache } from './routes/standingsRoutes.js';
import powerRankingsRoutes from './routes/powerRankingsRoutes.js';


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
app.use('/power-rankings', powerRankingsRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Premier League Predictor API');
});

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const ML_KEEPALIVE_MS = 10 * 60 * 1000; // 10 minutes — keeps Render free tier awake

async function pingMlService() {
    try {
        await axios.get(`${process.env.ML_SERVICE_URL}/health`, { timeout: 5000 });
        console.log('[ml] keep-alive ping ok');
    } catch {
        console.warn('[ml] keep-alive ping failed — service may be waking up');
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    warmStandingsCache();
    syncFinishedMatches();
    setInterval(syncFinishedMatches, SYNC_INTERVAL_MS);
    pingMlService();
    setInterval(pingMlService, ML_KEEPALIVE_MS);
});