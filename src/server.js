import express from "express";
import http from "http";
import SocketIO from "socket.io";
require("dotenv").config(); // 환경변수 초기화

const mongoose = require("mongoose");
const cors = require("cors");
const chatRoomRouter = require("./routes/chatroom");
const userRouter = require("./routes/user");
const authJwt = require("./middleware/auth").checkToken;
const app = express();

app.set("views", __dirname + "/views");
app.use(cors());
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

app.use("/api/chatroom", chatRoomRouter);
app.get("/test", authJwt);
app.use("/api/user", userRouter);

// CONNECT TO MONGODB SERVER
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((e) => console.error(e));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer, { cors: { origin: "*" } });

const oneToOneMatchingQ = [];

wsServer.on("connection", (socket) => {
  console.log("New connection");

  socket.onAny((event) => console.log(event));

  socket.on("random_one_to_one", () => {
    // 큐 내부 원소가 0개 일 경우 그냥 큐에 넣습니다.
    // 1이상일 경우 큐에서 하나 뽑아서 씁니다.

    if (oneToOneMatchingQ.length === 0) {
      oneToOneMatchingQ.push(socket);
    } else {
      const matchedSocket = oneToOneMatchingQ.shift();
      const roomName = matchedSocket.id + socket.id;

      socket.join(roomName);
      matchedSocket.join(roomName);

      // console.log(`${socket.id} and ${matchedSocket.id} are matched`);
      wsServer.to(roomName).emit("matched", roomName);
    }
  });

  socket.on("discon", (roomName) => {
    if (roomName !== undefined) {
      wsServer.in(roomName).disconnectSockets(true);
      oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(socket), 1);
    } else {
    }
  });

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("matched");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(process.env.PORT, handleListen);
