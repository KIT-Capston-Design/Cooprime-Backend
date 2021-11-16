const mongoose = require('mongoose');

const { Schema } = mongoose;
const chatRoomSchema = new Schema({
    
});

module.exports = mongoose.model('USER', chatRoomSchema);
