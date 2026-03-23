import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

const JWKS_URL = process.env.AUTH_HUB_JWKS_URL || 'http://localhost:3000/api/v1/oidc/.well-known/jwks.json';

// Fetch the JWKS remote keyset once (lazy-loaded as needed)
const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URL));

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the RS256 signed JWT against AuthHub's public keys
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
       issuer: process.env.AUTH_HUB_URL || 'http://localhost:3000',
       algorithms: ['RS256']
    });

    req.user = {
      uid: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string
    };
    next();
  } catch (error) {
    console.error('Error verifying AuthHub JWT:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
