import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 5000;
const app = express();

require('dotenv').config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());




const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello Backend!');
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});