import { Server } from 'ws';

let wsServer;

export default function handler(req, res) {
  if (!res.socket.server.wss) {
    console.log('Starting WebSocket server...');
    wsServer = new Server({ server: res.socket.server });

    wsServer.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('message', (message) => {
        console.log('Received:', message);

        wsServer.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(`Server received: ${message}`);
          }
        });
      });

      socket.on('close', () => {
        console.log('Client disconnected');
      });
    });

    res.socket.server.wss = wsServer;
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
