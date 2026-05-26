"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const socket_1 = require("./config/socket");
const socketHandlers_1 = require("./socket/socketHandlers");
const httpServer = (0, http_1.createServer)(app_1.default);
const io = (0, socket_1.initSocket)(httpServer);
(0, socketHandlers_1.registerSocketHandlers)(io);
httpServer.listen(env_1.env.PORT, () => {
    console.log(`WorkBee server running on port ${env_1.env.PORT}`);
});
