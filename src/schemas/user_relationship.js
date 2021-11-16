const mongoose = require('mongoose');

const { Schema } = mongoose;
const user_relationshipSchema = new Schema({
    RELATING_USER_ID : {
        type : String,
        required : true,
        ref : 'USER'
    },
    RELATED_USER_ID :{
      type : String,
      required : true,
      ref : 'USER'  
    },
    TYPE : {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('USER_RELATIONSHIP', user_relationshipSchema);
