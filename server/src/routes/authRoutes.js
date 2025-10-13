import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 8);
})