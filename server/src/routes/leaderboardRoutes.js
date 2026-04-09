import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// GET /leaderboard — ranked list of users by total points earned
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                username: true,
                predictions: {
                    select: { pointsEarned: true }
                }
            }
        });

        const leaderboard = users
            .map((user) => ({
                username: user.username,
                totalPoints: user.predictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0),
                predictionsCount: user.predictions.length
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints);

        res.json(leaderboard);
    } catch (error) {
        console.log(error.message);
        res.status(503).json({ error: 'Service unavailable' });
    }
});

export default router;
