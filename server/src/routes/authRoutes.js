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
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.log(error.message)
        res.sendStatus(503);
    }
})

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // look up the user by their email
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        // if user not found, send 404
        if (!user) return res.status(404).send({message: "User not found"});

        // compare the password the user sent, with the hashed password in the db
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {return res.status(401).send({message: "Invalid password"});}
        console.log(user);
        // successful authentication, create a token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,
            { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.log(error.message);
        res.status(503).send({ message: 'Service unavailable' });
    }
});

export default router;