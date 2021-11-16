const mongoose = require('mongoose');

const { Schema } = mongoose;
const reportSchema = new Schema({
    REPORT_ID : {
        type : Number,
        required : true,
        unique : true
    },
    REPROTER : {
        type : String,
        required : true,
        ref : 'USER'
    },
    REPORTEE : {
        type : String,
        required : true,
        ref = 'USER'
    },
    REPORT_TIME : {
        type : Date,
        default : Date.now 
    },
    REPORT_TYPE : {
        type : String,
        required : true
    },
    REPORT_DATA : {
        type : Buffer,
        required : true
    }

});

module.exports = mongoose.model('REPORT', reportSchema);
