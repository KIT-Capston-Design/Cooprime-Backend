const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const assert = require("assert");

describe("Socket Event Testing", () => {
  let io, serverSocket, clientSocket;

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

  describe("OneToOneCall Testing", () => {
    it("should work (with ack)", (done) => {
      serverSocket.on("random_one_to_one", (data) => {
        assert.equal(data, "test");
        done();
      });

      clientSocket.emit("random_one_to_one", "test");
    });
  });
});
