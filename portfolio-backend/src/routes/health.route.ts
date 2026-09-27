import { Router, type Request, type Response } from 'express';

const router = Router();

function handleHealthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'healthy',
    service: 'portfolio-backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
}

// Health check endpoints for Render and monitoring probes
router.get('/health', handleHealthCheck);

export default router;
