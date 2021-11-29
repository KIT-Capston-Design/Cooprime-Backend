require("dotenv").config(); // 환경변수 초기화

const { client: redisClient, auth: runRedisAuth } = require("./redis");
const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const dbInit = require("./config/db/dbInit");
const socketInit = require("./config/socket/socketInit");
const httpServer = http.createServer(app);
const cookieParser = require("cookie-parser");
// const authJwt = require("./middleware/auth").checkToken;

module.export = app;

const SocketIO = require("socket.io");
const wsServer = SocketIO(httpServer, { cors: { origin: "*" } }); // WebSocket Server

app.use(cors());
app.use(cookieParser);
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));
app.use("/", require("./routes/index")); // routing

//Initialize
(async () => {
  await runRedisAuth();
})();

/*
  서버 설정? and 초기화
*/
dbInit();
socketInit(wsServer);

/*
  서버 실행
*/

const handleListen = () =>
  console.log(`Listening on http://localhost:${process.env.PORT}`);
httpServer.listen(process.env.PORT, handleListen);
