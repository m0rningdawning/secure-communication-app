import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return new Response(JSON.stringify({ message: "User ID is required" }), {
      status: 400,
    });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          id: parseInt(userId),
        },
      },
    },
    include: {
      participants: true,
      messages: true,
    },
  });

  return new Response(JSON.stringify({ conversations }), { status: 200 });
}

export async function POST(req: Request) {
  try {
    const { userId, recipientEmail } = await req.json();

    if (!userId || !recipientEmail) {
      return new Response(
        JSON.stringify({ message: "User ID and recipient email are required" }),
        { status: 400 }
      );
    }

    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
    });

    if (!recipient) {
      return new Response(JSON.stringify({ message: "Recipient not found" }), {
        status: 404,
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: parseInt(userId) }, { id: recipient.id }],
        },
      },
      include: {
        participants: true,
      },
    });

    return new Response(JSON.stringify({ conversation }), { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ message: "Conversation ID is required" }),
        { status: 400 }
      );
    }

    const activeConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!activeConversation) {
      return new Response(
        JSON.stringify({ message: "Conversation not found" }),
        { status: 404 }
      );
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.message.deleteMany({
        where: { conversationId },
      });
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
    });

    return new Response(
      JSON.stringify({ message: "Conversation deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
