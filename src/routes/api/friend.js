/*
    친구관리
        친구 신청 처리
        친구 조회
        친구 삭제
        친구 차단
*/

const express = require("express");
const router = express.Router();

/* GET users listing. */
router.get("/", function (req, res) {
  res.send("respond with a resource");
});

module.exports = router;
