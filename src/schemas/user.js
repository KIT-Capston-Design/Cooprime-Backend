const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
    USER_ID : {
        type : String,
        required = true,
        unique = true
    },
    PHONE_NUM : {
        type : Number,
        required = true,
        unique = true 
    },
    PASSWORD : {
        type : String,
        required = true
    },
    INTRODUCTION : {
        type : String
    },
    PROFILE_IMG_PATH: {
        type : String
    },
    NAME : {
        type : String,
        required = true
    },
    REGISTER_DATE : {
        type = Date,
        required = true,
        default : Date.now
    },
    WITHDRAW_DATE : {
        type : Date
    },
    TAG : {
        type : [String]
    }
});

module.exports = mongoose.model('USER', userSchema);
