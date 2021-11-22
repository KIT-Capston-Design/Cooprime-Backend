const express = require("express");
const app = require("../server");
const router = express.Router();

/*
  Routing
*/
app.use("/api", require("./api/index"));

module.exports = router;
