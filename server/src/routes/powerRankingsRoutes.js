import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${process.env.ML_SERVICE_URL}/power-rankings`);
        res.json(response.data);
    } catch (error) {
        console.error('[power-rankings]', error.message);
        res.status(503).json({ error: 'ML service unavailable' });
    }
});

export default router;
