const mongoose = require('mongoose');

const { Schema } = mongoose;
const callHistorySchema = new Schema({
    CALL_HISTORY_ID : {
        type : String,
        unique : true,
        required : true
    },
    SENDER_ID : { 
        type : String,
        ref : 'USER',
        required : true
    },
    RECEIVER_ID : {
        type : String,
        ref : 'USER',
        required : true
    },
    CALL_START_TIME : {
        type : Date,
        required : true
    },
    CALL_END_TIME : {
        type : Date,
        required : true
    }
})

module.exports = mongoose.model('CALL_HISTORY', callHistorySchema);