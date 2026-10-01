import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);

router.post('/refresh', (req, res) => {
  // A mock refresh endpoint to prevent 404s and keep the app running.
  // In a real scenario, this would validate the refresh token and return new tokens.
  res.status(200).json({
    success: true,
    data: {
      accessToken: 'dummy_new_access_token',
      refreshToken: 'dummy_new_refresh_token'
    }
  });
});

export default router;
