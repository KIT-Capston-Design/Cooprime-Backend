const express = require("express");
const router = express.Router();
const app = require("../../server");

router.use("/login", require("./login"));
router.use("/chatroom", require("./chatroom"));

module.exports = router;
