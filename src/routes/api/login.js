/*
  로그인, 로그아웃, 회원가입, 휴대폰 인증, 통화기록, 회원정보 수정
*/

const express = require("express");
const router = express.Router();
const sendMessage = require("../../modules/sens/sens");
const randomNumberGenerator = require("../../modules/util/randomNumberGenerator");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const User = require("../../models/user");
const jwt = require("../../modules/jwt/jwt");

/*
  인증메일 요청
*/
router.post("/req/auth/msg", async (req, res, next) => {
  const { phone_number } = req.body;
  res.setHeader("Content-Type", "application/json");

  try {
    // 캐시 기존에 남아있는 정보 삭제
    myCache.del(phone_number);

    // 인증 번호 생성
    const randomNumber = String(randomNumberGenerator());

    // 캐시에 전화번호-인증번호 쌍 저장
    myCache.set(phone_number, randomNumber);

    // sms api
    await sendMessage(phone_number, randomNumber);

    return res.status(200).send({ status: "success" });
  } catch (err) {
    console.log(err);
  }
});

/*
  인증번호 검사
  성공하면 jwt 토큰 발급
*/
router.post("/register/auth/msg", async (req, res, next) => {
  const { phone_number, auth_number } = req.body;

  // find authNum in cache
  const authNumber = myCache.get(phone_number);

  res.setHeader("Content-Type", "application/json");

  if (auth_number !== authNumber) {
    return res.send({ status: "fail", msg: "인증번호가 다릅니다." });
  }

  try {
    // DB에서 검색 없으면 생성
    let user = await User.findOne({ phone_number });
    if (user === null) {
      user = new User({
        phone_num: phone_number,
      });
    }
    /* user의 idx, email을 통해 토큰을 생성! */
    const jwtToken = await jwt.sign(user);

    user.token = jwtToken;

    user.save((error, user) => {
      if (error) {
        return res.status(400).json({ error: "something wrong" });
      }

      return res.cookie("x_auth", user.token).status(200).json({
        status: "success",
        msg: "회원가입 성공",
        userId: user._id,
        token: user.token,
      });
    });
  } catch (err) {
    console.log(err);
  }
});

/*
  로그아웃
*/
router.get("/logout", async (req, res, next) => {
  return res.cookie("x_auth", "").json({ logoutSuccess: true });
});
module.exports = router;
