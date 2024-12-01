import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

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

  console.log("Starting WebSocket server on port 3000...");

  // const io = new SocketIOServer({
  //   path: "/api/socket",
  //   cors: {
  //     origin: "localhost:3000",
  //     methods: ["GET", "POST"],
  //   },
  // })
  const io = new Server(res.socket.server, {
    path: "/api/socket",
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (email) => {
      onlineUsers.set(email, socket.id);
      socket.join(email);
      console.log(`User with email ${email} joined.`);
    });

    socket.on(
      "sendMessage",
      async ({ conversationId, message, senderId, recipientEmail }) => {
        try {
          const recipient = await prisma.user.findUnique({
            where: { email: recipientEmail },
          });

          if (!recipient) {
            socket.emit("error", { message: "Recipient not found" });
            return;
          }

          const encryptedMessage = message;
          const newMessage = await prisma.message.create({
            data: {
              senderId,
              receiverId: recipient.id,
              content: encryptedMessage,
              conversationId,
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
          break;
        }
      }
    });
  });

  res.socket.server.io = io;
  res.status(201).json({ success: true, message: "WebSocket server started" });
}

// import { Server } from "socket.io";
// import { NextApiRequest, NextApiResponse } from "next";

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (!res.socket.server.io) {
//     const io = new Server(res.socket.server, {
//       path: "/api/socket",
//       cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],
//       },
//     });

//     io.on("connection", (socket) => {
//       console.log("A user connected:", socket.id);

//       socket.on("join", (email) => {
//         console.log(`${email} joined the chat`);
//       });

//       socket.on("disconnect", () => {
//         console.log("A user disconnected:", socket.id);
//       });
//     });

//     res.socket.server.io = io;
//   }
//   res.end();
// }
