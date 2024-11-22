import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Email and password are required' }),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    if (!secret) {
      return new Response(
        JSON.stringify({ message: 'JWT secret is not defined' }),
        { status: 500 }
      );
    }

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });

    return new Response(
      JSON.stringify({
        message: 'Logged in successfully',
        token,
        userId: user.id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging in user:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: 'OK' }),
    { status: 200 }
  );
}