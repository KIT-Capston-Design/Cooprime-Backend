require("dotenv").config(); // 환경변수 초기화

const { client: redisClient, auth: runRedisAuth, flushdb } = require("./redis");
const dbInit = require("./config/db/dbInit");
const socketInit = require("./config/socket/socketInit");

const express = require("express");
const http = require("http");
const app = express();
const httpServer = http.createServer(app);

// Socket
const SocketIO = require("socket.io");
const wsServer = SocketIO(httpServer, { cors: { origin: "*" } }); // WebSocket Server

app.use(require("cors")());
app.use(require("cookie-parser")());
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));
app.use("/", require("./routes/index")); // routing

// Redis Initialize
(async () => {
  await runRedisAuth();
  flushdb();
})();

// // 서버 설정 and 초기화
dbInit();
socketInit(wsServer);

// 서버 실행
const handleListen = () =>
  console.log(`Listening on http://localhost:${process.env.PORT}`);
httpServer.listen(process.env.PORT, handleListen);
