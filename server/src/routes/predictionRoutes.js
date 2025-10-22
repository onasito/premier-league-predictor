import express from 'express';
import prisma from '../prismaClient.js'
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Get predictions for authenticated user
