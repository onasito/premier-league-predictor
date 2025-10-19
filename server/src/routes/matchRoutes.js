import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
// Get upcoming matches
router.get('/upcoming', async (req, res) => {
    try {
        const response = await fetch('https://api.football-data.org/v2/competitions/PL/matches?status=SCHEDULED', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
        });
        const data = await response.json();
        res.json(data);

        const matches = data.matches.map(match => ({
            id: match.id,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            utcDate: match.utcDate,
            status: match.status,
            score: match.score.fullTime
        }));

        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
})

export default router;