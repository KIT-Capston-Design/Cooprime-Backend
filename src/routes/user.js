const express = require("express");
const router = express.Router();
const sendMessage = require("../API/sens/sens");
const randomNumberGenerator = require("../modules/util/randomNumberGenerator");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const User = require("../models/user");
const jwt = require("../modules/jwt");

router.post("/req/auth/msg", async (req, res, next) => {
  const { phone_number } = req.body;
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
    let user = await User.find({ phone_number });
    if (Array.isArray(user) && user.length === 0) {
      user = new User({
        phone_num: phone_number,
      });
      console.log(user);
      user.save().then(() => console.log("save success"));
    }

    /* user의 idx, email을 통해 토큰을 생성! */
    const jwtToken = await jwt.sign(user);

    // find authNum in cache
    const authNumber = myCache.get(phone_number);

    if (auth_number === authNumber) {
      res.send({ status: "success", token: jwtToken });
    } else {
      res.send({ status: "fail", msg: "인증번호가 다릅니다." });
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
