import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
// Get upcoming matches
router.get('/upcoming', async (req, res) => {
    try {
        // Get today's date in YYYY-MM-DD format (local time, not UTC)
        const now = new Date();
        const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const today = offsetDate.toISOString().split('T')[0];

        const response = await axios.get('https://v3.football.api-sports.io/fixtures/headtohead', {
            params: {
                date: "2025-10-19",
                league: 140,
                season: 2025,
                h2h: '33-34'
            },
            headers: {
                'x-rapidapi-key': process.env.FOOTBALL_DATA_API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io',
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
})

export default router;