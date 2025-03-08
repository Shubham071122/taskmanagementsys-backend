import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { AppDataSource } from '../data-source';

const router = Router();

// Ensure database is initialized before defining routes
if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet');
}

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes (auth required)
router.use(['/logout', '/check-auth'], authMiddleware);
router.post('/logout', logout);
router.get('/check-auth', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    name: req.user.name
                }
            }
        });
    } catch (error) {
        console.error('Check auth error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
