import { prisma } from '@/lib/prisma';
import { decryptMessage } from '@/lib/cryptoUtils';

export async function POST(req: Request) {
  try {
    const { messageId } = await req.json();

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return new Response(
        JSON.stringify({ message: 'Message not found' }),
        { status: 404 }
      );
    }

    const privateKey = req.headers.get('x-private-key');
    if (!privateKey) {
      return new Response(
        JSON.stringify({ message: 'Private key not provided' }),
        { status: 400 }
      );
    }

    const decryptedMessage = await decryptMessage(privateKey, message.content);

    return new Response(
      JSON.stringify({ message: 'Message received successfully', decryptedMessage }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error receiving message:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}