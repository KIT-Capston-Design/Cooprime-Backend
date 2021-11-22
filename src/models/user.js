const mongoose = require("mongoose");

// Define Schemes
const userSchema = new mongoose.Schema({
  phone_num: {
    type: String,
    required: true,
    unique: true,
  },
  introduction: {
    type: String,
  },
  token: {
    type: String,
  },
  profile_img: {
    type: String,
  },
  nickname: {
    type: String,
  },
  register_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  tags: {
    type: [String],
  },
});

// Find One by todoid
userSchema.statics.findOneByPhoneNumber = function (phone_number) {
  return this.findOne({ phone_number });
};

module.exports = mongoose.model("User", userSchema);
