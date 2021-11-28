import express, { json } from "express";
import http from "http";
import SocketIO from "socket.io";
import socketInit from "./config/socket/socketInit.js";
import dbInit from "./config/db/dbInit";
import { exists } from "./models/user.js";
import { flushdb, auth as runRedisAuth } from "./redis"; // 사용 시 필요 연산 추가 import 필요

require("dotenv").config(); // 환경변수 초기화

const cors = require("cors");
// const chatRoomRouter = require("./routes/chatroom");
// const userRouter = require("./routes/user");
// const authJwt = require("./middleware/auth").checkToken;
const app = express();

app.set("views", __dirname + "/views");
app.use(cors());
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

// app.use("/api/chatroom", chatRoomRouter);
// app.get("/test", authJwt);
// app.use("/api/user", userRouter);

//Initialize
(async () => {
  await runRedisAuth();
})();

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer, { cors: { origin: "*" } });

dbInit();
socketInit(wsServer);

// 방 목록 기초데이터 삽입
(() => {
  flushdb();
  // set("user:1", "123");
  // set("user:2", "456");
  // set("user:3", "park");
  // set("user:4", "jin");
  // set("user:5", "woo");
  // set("user:6", "123");
  // set("user:7", "456");
  // set("user:8", "park");
  // set("user:9", "jin");
  // set("user:10", "woo");

  // sadd("tag:user:1", ["라면", "콜라", "아이패드", "물통", "스마트폰"]);
  // sadd("tag:user:2", ["밥", "노트북", "마우스", "게임", "키보드"]);
  // sadd("tag:user:3", ["밥", "로션", "필통", "마스크", "지우개"]);
  // sadd("tag:user:4", ["밥", "돈까스", "케이블", "가방", "이불"]);
  // sadd("tag:user:5", ["밥", "모니터", "독서대", "책", "박진우"]);
  // sadd("tag:user:6", ["라면", "콜라", "아이패드", "물통", "스마트폰"]);
  // sadd("tag:user:7", ["밥", "휴대폰", "샤프", "게임", "키보드"]);
  // sadd("tag:user:8", ["밥", "분식", "물통", "마스크", "지우개"]);
  // sadd("tag:user:9", ["밥", "만두", "케이블", "가방", "이불"]);
  // sadd("tag:user:10", ["휴지", "모니터", "대학생", "프로그래밍", "경시대회"]);
})();

const handleListen = () =>
  console.log(`Listening on http://localhost:${process.env.PORT}`);
httpServer.listen(process.env.PORT || 3002, handleListen);
