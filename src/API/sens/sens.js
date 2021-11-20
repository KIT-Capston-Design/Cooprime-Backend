const randomNumberGenerator = require("../../controllers/user/randomNumberGenerator");

function sendMessage(phone, authNumber) {
  // 전화 번호
  const userPhoneNumber = phone;

  // 모듈들을 불러오기. 오류 코드는 맨 마지막에 삽입 예정
  const finErrCode = 404;
  const axios = require("axios");
  const CryptoJS = require("crypto-js");
  const date = Date.now().toString();

  // 환경변수로 저장했던 중요한 정보들
  const uri = process.env.SENS_SERVICE_ID;
  const secretKey = process.env.SENS_SECRET_KEY;
  const accessKey = process.env.SENS_ACCESS_KEY;
  const my_number = process.env.SENS_MYNUM;

  // 그 외 url 관련
  const method = "POST";
  const space = " ";
  const newLine = "\n";
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
  const url2 = `/sms/v2/services/${uri}/messages`;

  // 중요한 key들을 한번 더 crypto-js 모듈을 이용하여 암호화 하는 과정.
  // 이런 모습은 꽤나 믿을 만 한 api이다.

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(accessKey);
  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);
  console.log("authNum", authNumber);

  axios({
    method: method,
    // request는 uri였지만 axios는 url이다
    url: url,
    headers: {
      "Contenc-type": "application/json; charset=utf-8",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": date,
      "x-ncp-apigw-signature-v2": signature,
    },
    // request는 body였지만 axios는 data다
    data: {
      type: "SMS",
      countryCode: "82",
      from: my_number,
      // 원하는 메세지 내용
      content: `[서로소] 인증번호 [${authNumber}]를 입력해주세요.`,
      messages: [
        // 신청자의 전화번호
        { to: `${userPhoneNumber}` },
      ],
    },
  })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
  return finErrCode;
}

module.exports = sendMessage;
