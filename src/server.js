import express from "express";
import http from "http";
import SocketIO from "socket.io";
import {
	client as redisClient,
	auth as runRedisAuth,
	set,
	get,
	zadd,
	zrangebyscore,
} from "./redis.js"; // 사용 시 필요 연산 추가 import 필요

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

//Initialize
(async () => {
	await runRedisAuth();
})();

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
const groupMatchingQ = [];

wsServer.on("connection", (socket) => {
	console.log("New connection");

	socket.onAny((event) => console.log(event));

	socket.on("ogc_observe_roomlist", () => {
		console.log("ogc_observe_roomlist");
	});

	// socket.on("ogc_room_create", (inf) => {
	// 	//inf : {userId, roomname, tags}
	// 	const roomInf = {
	// 		roomId: socket.id + "0",
	// 		roomName: inf.roomname,
	// 		roomTags: inf.tags,
	// 	};
	// 	zadd("ogcr", 1, roomInf);
	// });

	// socket.on("ogc_enter_room", (inf) => {
	// 	//inf : {userId, roomId}
	// 	//방 인원 확인하고, 갱신하고 입장
	// 	socket.socket.to(roomSocketId).emit("ogc_new_face", {});
	// }

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

	socket.on("random_group", () => {
		// 기존 큐에 세명 존재할 경우
		if (groupMatchingQ.length >= 3) {
			const clients = [socket, ...groupMatchingQ.splice(0, 3)];

			// 방이름은 소켓 id 조합하여 생성
			const roomName =
				clients[0].id + clients[1].id + clients[2].id + clients[3].id;

			for (let i = 0; i < clients.length; i++) {
				clients[i].groupChatMyRoleNum = i;
				clients[i].groupChatClients = clients;
				clients[i].join(roomName);
				clients[i].emit("random_group_matched", roomName, i); // i는 role 설정을 위하여 전송
			}

			clients.forEach((client) => client.groupChatMyRoleNum);
		} else {
			// 세명 안되면 그냥 push
			groupMatchingQ.push(socket);
		}
	});

	socket.on("discon", (roomName) => {
		if (roomName !== undefined) {
			wsServer.in(roomName).disconnectSockets(true);
			//oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(socket), 1);
			groupMatchingQ.splice(oneToOneMatchingQ.indexOf(socket), 1);
		}
	});

	socket.on("join_room", (roomName) => {
		socket.join(roomName);
		socket.to(roomName).emit("matched");
	});

	socket.on("offer", (offer, roomName, roleNum) => {
		//console.log(socket.groupChatMyRoleNum, roleNum);
		if (roleNum === undefined) {
			socket.to(roomName).emit("offer", offer);
		} else {
			socket.groupChatClients[roleNum].emit(
				"offer",
				offer,
				socket.groupChatMyRoleNum
			);
		}
	});

	socket.on("answer", (answer, roomName, roleNum) => {
		//console.log(socket.groupChatMyRoleNum, roleNum);
		if (roleNum === undefined) {
			socket.to(roomName).emit("answer", answer);
		} else {
			socket.groupChatClients[roleNum].emit(
				"answer",
				answer,
				socket.groupChatMyRoleNum
			);
		}
	});

	socket.on("ice", (ice, roomName, roleNum) => {
		//console.log(socket.groupChatMyRoleNum, roleNum);
		if (roleNum === undefined) {
			socket.to(roomName).emit("ice", ice);
			//console.log("roleNum is undefined");
		} else {
			//console.log(socket.groupChatMyRoleNum);
			socket.groupChatClients[roleNum].emit(
				"ice",
				ice,
				socket.groupChatMyRoleNum
			);
		}
	});
});

const handleListen = () =>
	console.log(`Listening on http://localhost:${process.env.PORT}`);
httpServer.listen(process.env.PORT, handleListen);
