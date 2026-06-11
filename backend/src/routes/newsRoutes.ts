import express, { Request, Response } from 'express';
import { getNewsByCategory } from '../controllers/newsController';

const router = express.Router();

router.get('/indian-market', async (req: Request, res: Response): Promise<any> => {
  await getNewsByCategory(req, res, 'indian-market');
});

router.get('/ipo', async (req: Request, res: Response): Promise<any> => {
  await getNewsByCategory(req, res, 'ipo');
});

router.get('/global', async (req: Request, res: Response): Promise<any> => {
  await getNewsByCategory(req, res, 'global');
});

router.get('/earnings', async (req: Request, res: Response): Promise<any> => {
  await getNewsByCategory(req, res, 'earnings');
});

export default router;
