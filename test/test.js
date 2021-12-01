const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const assert = require("assert");
const redis = require("redis");

function createClient() {
	const client = redis.createClient(6379, "kitcapstone.iptime.org");
	client.auth(8788, (err, reply) => {
		if (err) throw err;
	});
	client.on("error", (err, reply) => {
		if (err) throw err;
		console.log("Error " + reply);
	});
	return client;
}

describe("Socket Event Testing", () => {
	let io, serverSocket, clientSocket, redisClient;

	before((done) => {
		const httpServer = createServer();
		io = new Server(httpServer);
		httpServer.listen(() => {
			const port = httpServer.address().port;
			clientSocket = new Client(`http://localhost:${port}`);

			io.on("connection", (socket) => {
				serverSocket = socket;
			});

			clientSocket.on("connect", done);
		});
		redisClient = createClient();
	});

	after(() => {
		io.close();
		clientSocket.close();
	});

	describe("default testing", () => {
		it("should work", (done) => {
			clientSocket.on("hello", (arg) => {
				assert.equal(arg, "world");
				done();
			});

			serverSocket.emit("hello", "world");
		});

		it("should work (with ack)", (done) => {
			serverSocket.on("hi", (cb) => {
				cb("hola");
			});

			clientSocket.emit("hi", (arg) => {
				assert.equal(arg, "hola");
				done();
			});
		});
	});

	describe("OnetoOneCall", () => {
		let oneToOneMatchingQ = [];

		it("일대일 통화 시작", (done) => {
			serverSocket.on("random_one_to_one", (data) => {
				oneToOneMatchingQ.push(clientSocket);
				const tags = JSON.parse(data);

				const userKey = `user:${clientSocket.id}`;
				let value = redisClient.set(userKey, clientSocket.id);
				assert.equal(value, true);

				const tagKey = `tag:${userKey}`;
				value = redisClient.sadd(tagKey, tags);
				assert.equal(value, true);

				done();
			});

			clientSocket.emit(
				"random_one_to_one",
				JSON.stringify(["태그", "테스트"])
			);
		});

		it("방 입장", (done) => {
			serverSocket.on("join_room", (roomName) => {
				serverSocket.join(roomName);

				assert.ok(serverSocket.adapter.rooms.get(roomName));

				done();
			});

			clientSocket.emit("join_room", "방제목제목");
		});

		it("일대일 통화 퇴장", (done) => {
			serverSocket.on("discon_onetoone", (roomName) => {
				io.to(roomName).emit("discon_onetoone");
				if (roomName !== undefined) {
					io.in(roomName).disconnectSockets(true);
					assert.ok(
						oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(clientSocket), 1)
					);
				}
			});

			clientSocket.on("discon_onetoone", () => {
				done();
			});

			clientSocket.emit("discon_onetoone", "방제목제목");
		});
	});

	describe("Open Group Call", () => {
		it("방 생성", () => {
			serverSocket.on("ogc_room_create", (roomInf) => {
				serverSocket.userId = "userId";

				let roomId = `ogcr:${serverSocket.id}`;
				// 본인이 생성했던 방이 남아있다면 새 방의 ID는 뒤에 0을 붙인다.

				// 방 정보 레디스 게시
				redisClient.hset(roomId, [
					"roomName",
					roomInf.roomName,
					"tags",
					JSON.stringify(roomInf.tags),
				]);
				redisClient.lpush(`${roomId}:userlist`, serverSocket.userId);

				redisClient.zadd("ogcrs", 1, roomId);

				//시간차 접속 위한
				redisClient.hset(`${roomId}:time`, [
					"time",
					Math.floor(Date.now() / 1000),
				]);

				redisClient.expire(roomId, 43200);
				redisClient.expire(`${roomId}:userlist`, 43200);

				// 방 입장

				assert.ok(redisClient.hgetall(roomId));
			});

			clientSocket.emit("ogc_room_create", {
				roomName: "방제목제목",
				tags: ["태그", "테스트"],
			});
		});
	});
});
