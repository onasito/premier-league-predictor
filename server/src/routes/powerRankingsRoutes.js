import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await axios.get(`${process.env.ML_SERVICE_URL}/power-rankings`, { timeout: 15000 });
            return res.json(response.data);
        } catch (error) {
            if (attempt === 1) {
                console.error('[power-rankings]', error.message);
                return res.status(503).json({ error: 'ML service unavailable' });
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    }
});

export default router;
