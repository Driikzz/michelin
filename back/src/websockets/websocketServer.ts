import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Initialize WebSocket server
export function initializeWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        console.log('New WebSocket connection established');

        // Handle incoming messages
        ws.on('message', (message: string) => {
            console.log(`Received message: ${message}`);
            // Echo the message back to the client
            ws.send(`Server received: ${message}`);
        });

        // Handle disconnection
        ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
    });

    console.log('WebSocket server initialized');
}
