import { NextApiRequest } from 'next';

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  user?: {
    userId: number;
    // role: string;
  };
}
