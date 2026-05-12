import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// GET /standings — fetch current PL standings table
router.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://api.football-data.org/v4/competitions/PL/standings', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
        });

        const standings = response.data.standings;
        const table = standings.find(s => s.type === 'TOTAL')?.table ?? [];

        res.json({ table });
    } catch (error) {
        console.error('Error fetching standings:', error.message);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
});

export default router;
