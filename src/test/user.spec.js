const assert = require('assert');
const secretKey = process.env.JWT_SECRET_KEY;
const express = require('express');
const { request } = require('http');
const router = express.Router();
const app = require('../server.js');
const User = require("../models/user");
const jwt = require("../modules/jwt/jwt");
const dbInit = require("../config/db/dbInit");
import 'regenerator-runtime'



describe('회원가입, 로그인 테스트', function() {
    var svr = "http://KITCapstone.iptime.org:3000";

    describe("유저 -> ", function() {
        var user = new User({
            phone_num : "01031798788"  //제 서버에 제번호가 저장되있기에 허허.. 
        });
        /*
            회원가입은 인증했다고 가정.. 인증 CacheNode가 접근할 수가 없네..
        */
        it("jwtTokenGet", ()=> {
            const payload = {
                idx : user._id,
                phone_number : user.phone_num
            }
            const jwtToken =  jwt.sign(payload, secretKey);
            console.log(jwtToken);
            assert.ok(jwtToken);
        });
    });
});
