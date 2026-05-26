import "dotenv/config";
import { createServer } from "http";

import app from "./app";
import { env } from "./config/env";
import { initSocket } from "./config/socket";
import { registerSocketHandlers } from "./socket/socketHandlers";

const httpServer = createServer(app);
const io = initSocket(httpServer);
registerSocketHandlers(io);

httpServer.listen(env.PORT, () => {
  console.log(`WorkBee server running on port ${env.PORT}`);
});
