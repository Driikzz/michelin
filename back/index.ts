import app from './src/app';
import { createServer } from 'http';
import { initializeWebSocketServer } from './src/websockets/websocketServer';

const port = process.env.PORT || 5000;

const server = createServer(app);

// Initialize WebSocket server
initializeWebSocketServer(server);

server.listen(port, () => {
  console.log(`Express server with WebSocket running on http://localhost:${port}`);
});