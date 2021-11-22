const jwt = require("../modules/jwt/jwt");
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const authUtil = {
  checkToken: async (req, res, next) => {
    var token = req.headers.token;
    console.log(token);
    // 토큰 없음
    if (!token) return res.send({ status: "fail1", msg: "jwt 인증 실패" });
    // decode
    const user = await jwt.verify(token);
    console.log(user);
    // 유효기간 만료
    if (user === TOKEN_EXPIRED)
      return res.send({ status: "fail2", msg: "jwt 인증 실패" });
    // 유효하지 않는 토큰
    if (user === TOKEN_INVALID)
      return res.send({ status: "fail3", msg: "jwt 인증 실패" });
    if (user.idx === undefined)
      return res.send({ status: "fail4", msg: "jwt 인증 실패" });
    req.idx = user.idx;
    next();
  },
};

module.exports = authUtil;
