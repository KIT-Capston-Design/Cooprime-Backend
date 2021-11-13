import express from "express";
import http from "http";
import SocketIO from "socket.io";

// import WebSocket, { WebSocketServer } from "ws";

const path = require('path');
const morgan = require('morgan');
const nunjucks = require('nunjucks');

const connect = require('./schemas');

const app = express();

connect();

app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
// app.get("/", (req, res) => res.render("home"));
// app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer, { cors: { origin: "*" } });




const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);

/*
  랜덤매칭
  웹기준으로 브라우저 에서 무슨 값을 해쉬로 만듬
  그래서 앞의 몇자리를
  room으로 만들고 그걸 랜덤으로 매칭?
  클라이언트랑 서버랑 연결된 세션id로 room을 만들자?

*/
