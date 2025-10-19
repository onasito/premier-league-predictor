import express from 'express';
import verifyToken  from '../middleware/verifyToken.js';
import prisma from '../prismaClient.js';

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, username: true, email: true }
        });
        // if user returns null, that means no user was found
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        // return the user profile information as an object
        res.json(user);
    }
    catch (error) {
        console.log(error.message);
        res.status(503).send({ message: 'Service unavailable' });
    }
})

export default router;