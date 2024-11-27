import { NextApiResponse, NextApiHandler } from 'next';
import { AuthenticatedNextApiRequest } from '@/types/next';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET as string;

export const isAuthenticated = (handler: NextApiHandler) => {
  return async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, secret) as { userId: number; role: string };
      req.user = decoded;

      return handler(req, res);
    } catch (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
  };
};
