import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define routes
router.post('/createUser');
router.post('/login');
router.get('/me');
router.delete('/books/:bookId');
router.put('/saveBook');
// Serve React front-end in production
router.use((_req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});
export default router;
