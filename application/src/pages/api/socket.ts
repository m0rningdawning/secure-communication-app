import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketServerWithIO {
  io?: SocketIOServer | undefined;
}
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketServerWithIO;
}

export default function SocketHandler(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    console.log("WebSocket server is already running.");
    res
      .status(200)
      .json({ success: true, message: "WebSocket server already running" });
    return;
  }

  console.log("Starting WebSocket server on port 8888...");

  const io = new SocketIOServer({
    path: "/api/socket",
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  }).listen(8888);

  const onlineUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (email) => {
      onlineUsers.set(email, socket.id);
      socket.join(email);
      console.log(`User with email ${email} joined.`);
      io.emit("userOnline", email);
    });

    socket.on(
      "sendMessage",
      async ({ conversationId, message, senderId, recipientEmail }) => {
        try {
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: true },
          });

          if (!conversation) {
            socket.emit("error", { message: "Conversation not found" });
            return;
          }

          const recipient = await prisma.user.findUnique({
            where: { email: recipientEmail },
          });

          if (!recipient) {
            socket.emit("error", { message: "Recipient not found" });
            return;
          }

          const newMessage = await prisma.message.create({
            data: {
              senderId,
              receiverId: recipient.id,
              content: message,
              conversationId,
              timestamp: new Date(),
            },
          });

          const recipientSocketId = onlineUsers.get(recipientEmail);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("receiveMessage", newMessage);
          }
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    socket.on("disconnect", () => {
      for (const [email, id] of onlineUsers.entries()) {
        if (id === socket.id) {
          onlineUsers.delete(email);
          console.log(`User with email ${email} disconnected.`);
          io.emit("userOffline", email);
          break;
        }
      }
    });
  });

  res.socket.server.io = io;
  res.status(201).json({ success: true, message: "WebSocket server started" });
}
