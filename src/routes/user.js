const express = require("express");
const router = express.Router();
const sendMessage = require("../API/sens/sens");
const randomNumberGenerator = require("../controllers/user/randomNumberGenerator");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const User = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/req/auth/msg", async (req, res, next) => {
  const phone_number = req.body.phone_number;
  res.setHeader("Content-Type", "application/json");

  console.log("post is work");
  try {
    // 캐시 기존에 남아있는 정보 삭제
    myCache.del(phone_number);

    // 인증 번호 생성
    const randomNumber = String(randomNumberGenerator());

    // 캐시에 전화번호-인증번호 쌍 저장
    myCache.set(phone_number, randomNumber);

    // sms api
    await sendMessage(phone_number, randomNumber);
    res.send({ status: "success" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/register/auth/msg", async (req, res, next) => {
  const { phone_number, auth_number } = req.body;

  res.setHeader("Content-Type", "application/json");
  try {
    // create token
    const token = jwt.sign(
      {
        phone_number: phone_number, // 토큰의 내용(payload)
      },
      process.env.JWT_SECRET_KEY, // 비밀 키
      {
        expiresIn: "1m",
      }
    );

    // find authNum in cache
    const authNumber = myCache.get(phone_number);

    if (auth_number === authNumber) {
      // user 정보 db에 저장
      const user = new User({
        phone_num: phone_number,
      });
      user
        .save()
        .then(() => console.log("save success"))
        .then(() => res.send({ status: "success", token: token }));
    } else {
      res.send({ status: "fail", msg: "인증번호가 다릅니다." });
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
