import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import prisma from '../prismaClient.js';

dotenv.config();

const router = express.Router();

// GET /matches/upcoming — fetch today's matches from external API
router.get('/upcoming', async (req, res) => {
    try {
        const now = new Date();
        const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const today = offsetDate.toISOString().split('T')[0];

        const response = await axios.get('https://api.football-data.org/v4/matches', {
           headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
        });

        const todaysMatches = response.data.matches.filter(
            (match) => match.utcDate.startsWith(today)
        );

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
        }));

        res.json(response.data);
        //res.json(formattedMatches);
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// POST /matches/:id/result — record the final result and award points to all predictors
router.post('/:id/result', async (req, res) => {
    const matchId = parseInt(req.params.id);
    const { result } = req.body;

    const validResults = ['HOME', 'AWAY', 'DRAW'];
    if (!result || !validResults.includes(result)) {
        return res.status(400).json({ error: 'result must be HOME, AWAY, or DRAW' });
    }

    try {
        console.log("test");
        const match = await prisma.match.findUnique({ where: { id: matchId } });
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        if (match.result) {
            return res.status(409).json({ error: 'Result already recorded for this match' });
        }

        // Save the result on the match
        await prisma.match.update({
            where: { id: matchId },
            data: { result }
        });

        // Award 3 points to every user who predicted correctly, 0 for wrong
        const predictions = await prisma.prediction.findMany({
            where: { matchId }
        });

        await Promise.all(predictions.map((prediction) =>
            prisma.prediction.update({
                where: { id: prediction.id },
                data: { pointsEarned: prediction.predictedWinner === result ? 3 : 0 }
            })
        ));

        res.json({
            message: `Result recorded. ${predictions.filter(p => p.predictedWinner === result).length}/${predictions.length} users predicted correctly.`
        });
    } catch (error) {
        console.log(error.message);
        res.status(503).json({ error: 'Service unavailable' });
    }
});

export default router;
