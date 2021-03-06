const {
  client: redisClient,
  auth: runRedisAuth,
  flushdb,
  hset,
  lpush,
  exists,
  set,
  get,
  zadd,
  zrangebyscore,
  hgetall,
  zscore,
  zrem,
  expire,
  time,
  sadd,
  exists: redisExists,
} = require("../../redis");
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
      tags.push("$");

      // tag
      console.log("tags", tags);

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
        socket.to(roomName).emit("discon_onetoone");
        wsServer.in(roomName).disconnectSockets(true);
      }

      if (roomName === undefined) {
        oneToOneMatchingQ.splice(oneToOneMatchingQ.indexOf(socket), 1);
      }
      const userKey = `user:${socket.id}`;
      redisClient.del(userKey);
      redisClient.del(`tag:${userKey}`);
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

    //// ogc 작업

    // ogc 방 입장 동시접속 방지 위한 스핀락 객체
    // 이 객체 안에 룸이름으로 프로퍼티가 생성되어 스핀락 state를 나타낸다.
    const spinlock = {};

    //// user id 어떻게 구해야 할지 몰라서 더미데이터 저장
    socket.userId = "01012345678";

    //// ogc 작업

    socket.on("ogc_ice", (ice, userSocketId) => {
      socket.to(userSocketId).emit("ogc_ice", ice, socket.id);
    });

    socket.on("ogc_offer", (offer, userSocketId) => {
      socket.to(userSocketId).emit("ogc_offer", offer, socket.id);
    });

    socket.on("ogc_answer", (answer, userSocketId) => {
      socket.to(userSocketId).emit("ogc_answer", answer, socket.id);
    });

    socket.on("ogc_unobserve_roomlist", () => {
      socket.leave("ogc_roomList_observers");
    });

    socket.on("ogc_enter_room", async (roomId, isSucc) => {
      //방 인원 조회
      let numOfUser = (await zscore("ogcrs", roomId)) * 1;

      // 4명 미만이면 방 입장 가능
      if (numOfUser < 4) {
        // 방 입장
        //방 인원 갱신
        zadd("ogcrs", numOfUser * 1 + 1, roomId);

        //방 유저 리스트에 해당 유저 추가
        lpush(`${roomId}:userlist`, socket.userId);

        // 방 입장

        socket.join(roomId);

        await enterRoom(roomId, numOfUser);
        // socket.to(roomId).emit("ogc_user_joins", socket.id, numOfUser);
        // 나중에 userId로 변경 필요

        // setTimeout(() => {
        // 	console.log("emit ogc_user_joins");
        // 	socket.to(roomId).emit("ogc_user_joins", socket.id, numOfUser);
        // }, 1000);

        console.log("방 입장 isSucc(true)");
        isSucc(roomId, numOfUser);
      } else {
        /*예외 : 방 인원초과*/
        console.log("방 입장 isSucc(false)");
        isSucc(false);
      }

      pushRoomList();
    });

    const getUnixTimeSec = () => Math.floor(Date.now() / 1000); //유닉스 초 단위 시각이다.
    const sleep = (t) => {
      return new Promise((resolve) => setTimeout(resolve, t));
    };

    // 동시 접속 방지
    const enterRoom = async (roomId, numOfUser) => {
      console.log("enterRoom()");
      let lastTime;

      // 스핀락을 사용하여 동일한 시각을 가져오는 것을 방지
      // await hgetall() 에서 대기하고 있을 때, 다른 동일 방 enterRoom() 코드가
      // 실행 될 수 있는데 이 때 spinlock이 true일 것이므로 500ms sleep하게 된다.
      // 이를 통해 동시 접속 방지를 위한 마지막 입장 시각을 가져올 때 동일한
      // 마지막 접속 시각을 가져오는 것을 방지한다.
      while (spinlock[roomId] === true) {
        console.log("---------------------spinlock---------------------");
        await sleep(500);
      }

      console.log("spinlock true");
      spinlock[roomId] = true;
      lastTime = Number((await hgetall(`${roomId}:time`)).time);
      console.log("spinlock false");
      spinlock[roomId] = false;

      const curTime = getUnixTimeSec();

      const delta = curTime - lastTime;

      console.log("delta", delta);

      if (delta <= 1) {
        setTimeout(() => {
          enterRoom(roomId, numOfUser);
        }, 1000);
      } else {
        hset(`${roomId}:time`, ["time", curTime]);
        console.log("emit ogc_user_joins");
        socket.to(roomId).emit("ogc_user_joins", socket.id, numOfUser);

        // hset("ogcr:d:time", ["time", Number((await time())[0])]);
      }
    };

    socket.on("ogc_observe_roomlist", async () => {
      observeRoomList();
    });

    const observeRoomList = () => {
      // 해당 클라이언트의 소켓을 방 목록 구독 리스트에 추가
      socket.join("ogc_roomList_observers");

      getRoomList().then((roomList) => {
        socket.emit("ogc_roomlist", roomList);
      });
    };

    const getRoomList = async () => {
      let idList;
      let roomInfList = [];

      //인원수 1~3명 방 아이디 리스트 조회
      idList = await zrangebyscore("ogcrs", 1, 3);

      //아이디 리스트로 방 정보 조회
      for (let i = 0; i < idList.length; i += 2) {
        await hgetall(idList[i]).then((roomInf) => {
          roomInfList.push({
            roomId: idList[i],
            roomName: roomInf.roomName,
            tags: JSON.parse(roomInf.tags),
            cnt: idList[i + 1],
          });
        });
      }
      return roomInfList;
    };
    const pushRoomList = async () => {
      /* 방 목록 구독 중인 클라이언트들에 갱신된 방 리스트 정보를 push */

      //방 정보 리스트 전송

      getRoomList().then((roomList) => {
        console.log("emit ogc_roomlist");
        console.log(roomList);
        socket.to("ogc_roomList_observers").emit("ogc_roomlist", roomList);
      });
    };

    socket.on("ogc_room_create", async (roomInf, done) => {
      roomInf = JSON.parse(roomInf);

      console.log(roomInf);

      let roomId = `ogcr:${socket.id}`;
      // 본인이 생성했던 방이 남아있다면 새 방의 ID는 뒤에 0을 붙인다.

      while ((await redisExists(roomId)) * 1) {
        console.log(roomId);
        roomId = roomId + "0";
      }

      // 방 정보 레디스 게시
      hset(roomId, [
        "roomName",
        roomInf.roomName,
        "tags",
        JSON.stringify(roomInf.tags),
      ]);
      lpush(`${roomId}:userlist`, socket.userId);

      zadd("ogcrs", 1, roomId);

      // 스핀락 init
      spinlock[roomId] = false;

      //시간차 접속 위한
      hset(`${roomId}:time`, ["time", getUnixTimeSec()]);

      expire(roomId, 43200);
      expire(`${roomId}:userlist`, 43200);
      // 방 입장
      socket.join(roomId);

      done(roomId);

      pushRoomList();
    });

    socket.on("ogc_exit_room", async (roomId) => {
      let numOfUser = (await zscore("ogcrs", roomId)) * 1;

      // 다른 유저들한테 이 유저의 퇴장을 알림
      socket.to(roomId).emit("ogc_user_leaves", socket.id, numOfUser);

      // 1명이면 방 삭제
      if (1 < numOfUser) {
        zadd("ogcrs", numOfUser * 1 - 1, roomId);
      } else {
        // 방 삭제
        zrem("ogcrs", roomId);
        delete spinlock[roomId];
      }

      // 이 유저는 방을 나감.
      socket.leave(roomId);
      observeRoomList();
      pushRoomList();
    });
  });
};
