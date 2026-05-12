import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import prisma from '../prismaClient.js';

dotenv.config();

const router = express.Router();

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function formatMatchForClient(match) {
    return {
        id: match.id,
        utcDate: match.date.toISOString(),
        status: match.status,
        competition: { name: 'Premier League' },
        homeTeam: { id: match.homeTeamId, name: match.homeTeam.name, shortName: match.homeTeam.shortName },
        awayTeam: { id: match.awayTeamId, name: match.awayTeam.name, shortName: match.awayTeam.shortName },
    };
}

// GET /matches/upcoming — fetch PL matches from today through the next 7 days
router.get('/upcoming', async (req, res) => {
    try {
        const now = new Date();
        const dateFrom = new Date(now);
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        dateTo.setHours(23, 59, 59, 999);

        // Check for a recently cached match in this range
        const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);
        const freshMatch = await prisma.match.findFirst({
            where: { date: { gte: dateFrom, lte: dateTo }, updatedAt: { gte: cacheThreshold } }
        });

        if (freshMatch) {
            const matches = await prisma.match.findMany({
                where: { date: { gte: dateFrom, lte: dateTo } },
                include: { homeTeam: true, awayTeam: true },
                orderBy: { date: 'asc' }
            });
            return res.json({ matches: matches.map(formatMatchForClient) });
        }

        // Cache is stale — fetch from API and save to DB
        const dateFromStr = now.toISOString().split('T')[0];
        const dateToStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await axios.get('https://api.football-data.org/v4/competitions/PL/matches', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
            params: { dateFrom: dateFromStr, dateTo: dateToStr }
        });

        const apiMatches = response.data.matches ?? [];
        console.log('Fetched from API:', apiMatches.length, 'matches');

        for (const match of apiMatches) {
            const homeTeam = await prisma.team.upsert({
                where: { externalId: match.homeTeam.id },
                update: { name: match.homeTeam.name, shortName: match.homeTeam.shortName ?? null },
                create: { externalId: match.homeTeam.id, name: match.homeTeam.name, shortName: match.homeTeam.shortName ?? null }
            });
            const awayTeam = await prisma.team.upsert({
                where: { externalId: match.awayTeam.id },
                update: { name: match.awayTeam.name, shortName: match.awayTeam.shortName ?? null },
                create: { externalId: match.awayTeam.id, name: match.awayTeam.name, shortName: match.awayTeam.shortName ?? null }
            });
            await prisma.match.upsert({
                where: { externalId: match.id },
                update: { status: match.status, date: new Date(match.utcDate) },
                create: {
                    externalId: match.id,
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    date: new Date(match.utcDate),
                    status: match.status
                }
            });
        }

        const matches = await prisma.match.findMany({
            where: { date: { gte: dateFrom, lte: dateTo } },
            include: { homeTeam: true, awayTeam: true },
            orderBy: { date: 'asc' }
        });

        res.json({ matches: matches.map(formatMatchForClient) });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// GET /matches/prediction?homeTeam=X&awayTeam=Y — get ML prediction for a match
router.get('/prediction', async (req, res) => {
    const { homeTeam, awayTeam } = req.query;

    if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: 'homeTeam and awayTeam are required' });
    }

    try {
        const response = await axios.post('http://localhost:8000/predict', {
            homeTeam,
            awayTeam
        });
        res.json(response.data);
    } catch (error) {
        console.error('ML API error:', error.message);
        res.status(503).json({ error: 'Prediction service unavailable' });
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
