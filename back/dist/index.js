"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./src/app"));
const http_1 = require("http");
const websocketServer_1 = require("./src/websockets/websocketServer");
const port = process.env.PORT || 5000;
const server = (0, http_1.createServer)(app_1.default);
// Initialize WebSocket server
(0, websocketServer_1.initializeWebSocketServer)(server);
server.listen(port, () => {
    console.log(`Express server with WebSocket running on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map