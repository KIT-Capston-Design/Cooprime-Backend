const oneToOneMatchingQ = [];
const groupMatchingQ = [];

module.exports = (wsServer) => {
  wsServer.on("connection", (socket) => {
    console.log("New connection");

    socket.onAny((event) => console.log(event));

    socket.on("random_one_to_one", () => {
      // 큐 내부 원소가 0개 일 경우 그냥 큐에 넣습니다.
      // 1이상일 경우 큐에서 하나 뽑아서 씁니다.
      console.log(oneToOneMatchingQ);
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
