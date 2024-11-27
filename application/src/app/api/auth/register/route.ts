import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, email, password, publicKey } = await req.json();

    if (!username || !email || !password || !publicKey) {
      return new Response(
        JSON.stringify({
          message: 'All fields are required: username, password, email, and publicKey',
        }),
        { status: 400 }
      );
    }

    if (username.length < 3 || password.length < 6) {
      return new Response(
        JSON.stringify({
          message: 'Username must be at least 3 characters and password at least 6 characters',
        }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'User already exists' }),
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        publicKey: publicKey,
      },
    });

    return new Response(
      JSON.stringify({
        message: 'User registered successfully',
        user: { id: user.id, username: user.username, createdAt: user.createdAt },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}