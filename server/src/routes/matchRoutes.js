import express from 'express';
// Import axios for making HTTP requests
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

        const response = await axios.get('https://api.football-data.org/v4/matches', {
           headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
        });


        const todaysMatches = response.data.matches.filter(
            (match) => match.utcDate.startsWith(today)
        )

        // If no matches today, return a message
        if (todaysMatches.length === 0) {
            return res.json({ message: 'No matches scheduled for today' });
        }

        const formattedMatches = todaysMatches.map((match) => ({
            competition: match.competition.name,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            matchTime: new Date(match.utcDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Los_Angeles',
            }),
            status: match.status,
        }))
        
        res.json(response.data);
        //res.json(formattedMatches);
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
})

export default router;