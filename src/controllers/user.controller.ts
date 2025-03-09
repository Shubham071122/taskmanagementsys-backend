import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../data-source';

const userRepository = AppDataSource.getRepository(User);

const generateTokens = (user: User) => {
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret as jwt.Secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    jwtRefreshSecret as jwt.Secret,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } as SignOptions
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {

  console.log("Register request:", req.body);
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Hashed password:", hashedPassword);
    const user = userRepository.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });
    console.log("User created:", user);


    await userRepository.save(user);

    return res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({ message: "Error creating user" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return res
      .status(200)
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        maxAge: getCookieMaxAge(process.env.ACCESS_TOKEN_EXPIRY || '15m')
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        maxAge: getCookieMaxAge(process.env.REFRESH_TOKEN_EXPIRY || '7d')
      })
      .json({
        status: 200,
        message: 'Login successful',
        data: { id: user.id, name: user.name, email: user.email }
      });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ message: 'Error during login' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) throw new Error('JWT_REFRESH_SECRET not set');

    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as { userId: string };

    const user = await userRepository.findOne({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: getCookieMaxAge(process.env.ACCESS_TOKEN_EXPIRY || '15m')
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: getCookieMaxAge(process.env.REFRESH_TOKEN_EXPIRY || '7d')
    });

    return res.status(200).json({ message: 'Tokens refreshed successfully' });

  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/'
    });

    return res.status(200).json({
      status: 200,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Error during logout'
    });
  }
};

const getCookieMaxAge = (duration: string): number => {
  const timeMap: { [key: string]: number } = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const match = duration.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const [, value, unit] = match;
  return parseInt(value) * timeMap[unit];
};
