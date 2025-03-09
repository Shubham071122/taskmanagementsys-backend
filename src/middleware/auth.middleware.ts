import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { AppDataSource } from '../data-source';

interface TokenPayload {
  userId: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken, refreshToken } = req.cookies;

    const jwtSecret = process.env.JWT_SECRET as string;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;

    if (!accessToken) {
      console.log('Access token missing');
      return refreshAccessToken(req, res, next, refreshToken, jwtRefreshSecret, jwtSecret);
    }

    try {
      // Verify Access Token
      const decoded = jwt.verify(accessToken, jwtSecret) as TokenPayload;
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      return next();
    } catch (error) {
      if ((error as jwt.JsonWebTokenError).name === 'TokenExpiredError') {
        // If the access token is expired, try refreshing it
        if (!refreshToken) {
          return res.status(401).json({ message: 'Refresh token missing' });
        }

        return refreshAccessToken(req, res, next, refreshToken, jwtRefreshSecret, jwtSecret);
      }

      return res.status(401).json({ message: 'Invalid access token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to parse duration like "15m", "1h", "1d" into milliseconds
function getCookieMaxAge(duration: string): number {
  const timeMap: { [key: string]: number } = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = duration.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const [, value, unit] = match;
  return parseInt(value) * timeMap[unit];
}

// Function to refresh access token
async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
  refreshToken: string,
  jwtRefreshSecret: string,
  jwtSecret: string
) {
  try {
    const refreshDecoded = jwt.verify(refreshToken, jwtRefreshSecret) as TokenPayload;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: refreshDecoded.userId },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '2h' } as SignOptions
    );

    // Set new access token in cookies
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: getCookieMaxAge(process.env.ACCESS_TOKEN_EXPIRY || '2h'),
    });

    req.user = user;
    return next();
  } catch (refreshError) {
    console.error('Error refreshing access token:', refreshError);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

