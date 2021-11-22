const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const dbInit = require("./config/db/dbInit");
const socketInit = require("./config/socket/socketInit");
const httpServer = http.createServer(app);
const cookieParser = require("cookie-parser");

const SocketIO = require("socket.io");
const wsServer = SocketIO(httpServer, { cors: { origin: "*" } }); // WebSocket Server

require("dotenv").config(); // 환경변수 초기화

module.exports = app;
// test

/*
MiddleWare
*/
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(__dirname + "/public"));
const auth = require("./middleware/auth").checkToken;
app.get("/test", auth);
app.use("/", require("./routes/index")); // routing

/*
  서버 설정? and 초기화
*/
dbInit();
socketInit(wsServer);

/*
  서버 실행
*/
const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(process.env.PORT, handleListen);
