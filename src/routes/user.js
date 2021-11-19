const express = require("express");
const router = express.Router();
const sendMessage = require("../API/sens/sens");

router.post("/", async (req, res, next) => {
  const phone_number = req.body.phone_number;
  //   const user = new UserReg({
  //     coin_name,
  //     coin_code,
  //     alert_price,
  //     nickname,
  //     phone_number,
  //     agreement,
  //   });
  res.setHeader("Content-Type", "application/json");

  console.log("post is work");
  try {
    // // user 정보를 mongodb에 저장한 후
    // await user.save();
    // sendMessage 모듈을 실행시킨다.
    await sendMessage(phone_number);
    res.send("send message!");
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
