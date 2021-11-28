import { set, get, sadd } from "../../redis"; // 사용 시 필요 연산 추가 import 필요
require("dotenv").config();

const redis = require("redis");

const oneToOneMatchingQ = [];
const groupMatchingQ = [];

const subscriber = redis.createClient(6379, "KITCapstone.iptime.org", {
  password: process.env.REDIS_PASSWORD || 8788,
});

subscriber.subscribe("random_matching");

module.exports = (wsServer) => {
  subscriber.on("message", async function (channel, message) {
    const [firstSocketId, secondSocketId] = JSON.parse(message);

    const firstSocket = oneToOneMatchingQ.find((value) => {
      return value.id == firstSocketId;
    });

    const secondSocket = oneToOneMatchingQ.find((value) => {
      return value.id == secondSocketId;
    });

    oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(firstSocket), 1);
    oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(secondSocket), 1);

    const roomName = firstSocketId + secondSocketId;

    firstSocket.join(roomName);
    secondSocket.join(roomName);

    // console.log(`${socket.id} and ${matchedSocket.id} are matched`);
    wsServer.to(roomName).emit("matched", roomName);
  });

  wsServer.on("connection", (socket) => {
    console.log("New connection");

    socket.onAny((event) => console.log("receive", event));

    socket.on("random_one_to_one", (data) => {
      // socket 정보 서버에서 관리
      oneToOneMatchingQ.push(socket);

      // 입력 tag들
      const tags = JSON.parse(data);

      // redis에 user set
      const userKey = `user:${socket.id}`;
      set(userKey, socket.id);
      console.log("insert", socket.id);

      // tag set
      const tagKey = `tag:${userKey}`;
      sadd(tagKey, tags);
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

    socket.on("discon_onetoone", (roomName) => {
      if (roomName !== undefined) {
        wsServer.in(roomName).disconnectSockets(true);
        oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(socket), 1);
      }
    });

    socket.on("discon_group", (roomName) => {
      if (roomName !== undefined) {
        wsServer.in(roomName).disconnectSockets(true);
        groupMatchingQ.splice(groupMatchingQ.indexOf(socket), 1);
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
};
