import express from 'express';
import prisma from '../prismaClient.js'
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Get predictions for authenticated user
router.post('/predictions', verifyToken, async (req, res) => {
    try {
        const {matchId, predictedWinner} = req.body;
        // if there is no matchId or predictedWinner, return 400
        if (!matchId || !predictedWinner) {
            return res.status(400).json({error: 'matchId and predictedWinner are required'});
        }
    } catch (error) {
        
    }
})