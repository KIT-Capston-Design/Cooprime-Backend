import express from "express";
import http from "http";
import SocketIO from "socket.io";
// import WebSocket, { WebSocketServer } from "ws";

const app = express();

app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
// app.get("/", (req, res) => res.render("home"));
// app.get("/*", (req, res) => res.redirect("/"));

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
httpServer.listen(3000, handleListen);

/*
  랜덤매칭
  웹기준으로 브라우저 에서 무슨 값을 해쉬로 만듬
  그래서 앞의 몇자리를
  room으로 만들고 그걸 랜덤으로 매칭?
  클라이언트랑 서버랑 연결된 세션id로 room을 만들자?

*/
