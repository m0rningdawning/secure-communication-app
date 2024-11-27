import { prisma } from '@/lib/prisma';
import { encryptMessage } from '@/lib/cryptoUtils';

export async function POST(req: Request) {
  try {
    const { conversationId, message } = await req.json();

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      return new Response(
        JSON.stringify({ message: 'Conversation not found' }),
        { status: 404 }
      );
    }

    const recipient = conversation.participants.find(
      (participant) => participant.id !== req.user.id
    );

    if (!recipient) {
      return new Response(
        JSON.stringify({ message: 'Recipient not found' }),
        { status: 404 }
      );
    }

    const encryptedMessage = await encryptMessage(recipient.publicKey, message);

    const newMessage = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: recipient.id,
        content: encryptedMessage,
        conversationId: conversation.id,
      },
    });

    return new Response(
      JSON.stringify({ message: 'Message sent successfully', newMessage }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}