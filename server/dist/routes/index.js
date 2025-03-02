import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRoutes from './api/user-routes.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
router.use('/api', apiRoutes);
// Serve up React front-end in production
router.use((_req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});
export default router;
