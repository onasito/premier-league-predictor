import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

let standingCache = {data: null, fetchedAt: 0};
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
// GET /standings — fetch current PL standings table
router.get('/', async (req, res) => {
    if (standingCache.data && Date.now() - standingCache.fetchedAt < CACHE_TTL_MS) {
        return res.json(standingCache.data);
    }

    try {
        const response = await axios.get('https://api.football-data.org/v4/competitions/PL/standings', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
        });

        const standings = response.data.standings;
        const table = standings.find(s => s.type === 'TOTAL')?.table ?? [];

        standingCache = { data: { table }, fetchedAt: Date.now() };
        res.json({ table });
    } catch (error) {
        console.error('Error fetching standings:', error.message);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
});

export default router;
