import express from 'express';
import prisma from '../prismaClient.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// POST /predictions — submit a prediction for a match
router.post('/', verifyToken, async (req, res) => {
    const { matchId, homeTeam, awayTeam, matchDate, predictedWinner } = req.body;

    if (!matchId || !homeTeam || !awayTeam || !matchDate || !predictedWinner) {
        return res.status(400).json({ error: 'matchId, homeTeam, awayTeam, matchDate, and predictedWinner are required' });
    }

    const validOutcomes = ['HOME', 'AWAY', 'DRAW'];
    if (!validOutcomes.includes(predictedWinner)) {
        return res.status(400).json({ error: 'predictedWinner must be HOME, AWAY, or DRAW' });
    }

    try {
        // Match must already exist in DB (saved when /upcoming was called)
        const match = await prisma.match.findUnique({ where: { id: matchId } });
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Prevent duplicate predictions from the same user for the same match
        const existing = await prisma.prediction.findFirst({
            where: { userId: req.userId, matchId: match.id }
        });
        if (existing) {
            return res.status(409).json({ error: 'You have already predicted this match' });
        }

        const prediction = await prisma.prediction.create({
            data: {
                userId: req.userId,
                matchId: match.id,
                predictedWinner
            }
        });

        res.status(201).json(prediction);
    } catch (error) {
        console.log(error.message);
        res.status(503).json({ error: 'Service unavailable' });
    }
});

// GET /predictions/my — get all predictions for the authenticated user
router.get('/my', verifyToken, async (req, res) => {
    try {
        const predictions = await prisma.prediction.findMany({
            where: { userId: req.userId },
            include: {
                match: {
                    include: {
                        homeTeam: true,
                        awayTeam: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(predictions);
    } catch (error) {
        console.log(error.message);
        res.status(503).json({ error: 'Service unavailable' });
    }
});

export default router;
