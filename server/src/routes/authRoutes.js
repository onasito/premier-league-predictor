import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const {username, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword
            }
        });

        // create a token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,
            { expiresIn: '24h' });
        // send the token to the user
        res.json({ token });
    } catch (error) {
        console.log(error.message)
        res.sendStatus(503);
    }
})

export default router;