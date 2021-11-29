const express = require("express");
const router = express.Router();

/*
  Routing
*/
router.use("/api", require("./api/index"));

module.exports = router;
