import express from 'express';
import axios from 'axios';
import prisma from '../prismaClient.js';

const router = express.Router();
const CACHE_KEY = 'power-rankings';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function fetchFromMlService() {
    const MAX_ATTEMPTS = 4;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            const response = await axios.get(`${process.env.ML_SERVICE_URL}/power-rankings`, { timeout: 10000 });
            return response.data;
        } catch (error) {
            if (attempt === MAX_ATTEMPTS - 1) throw error;
            await new Promise(r => setTimeout(r, 6000));
        }
    }
}

router.get('/', async (req, res) => {
    const cached = await prisma.cache.findUnique({ where: { key: CACHE_KEY } });
    if (cached) return res.json(cached.data);

    try {
        const data = await fetchFromMlService();
        await prisma.cache.create({ data: { key: CACHE_KEY, data } });
        return res.json(data);
    } catch (error) {
        console.error('[power-rankings]', error.message);
        return res.status(503).json({ error: 'ML service unavailable' });
    }
});

export async function warmPowerRankingsCache() {
    try {
        const data = await fetchFromMlService();
        await prisma.cache.upsert({
            where: { key: CACHE_KEY },
            update: { data },
            create: { key: CACHE_KEY, data }
        });
        console.log('[cache] Power rankings cached');
    } catch (error) {
        console.error('[cache] Failed to cache power rankings:', error.message);
    }
}

export function schedulePowerRankingsRefresh() {
    setInterval(warmPowerRankingsCache, REFRESH_INTERVAL_MS);
}

export default router;
