import { Router } from 'express';

const router = Router();

// Health check endpoint for Render
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CRM Backend',
  });
});

export default router;