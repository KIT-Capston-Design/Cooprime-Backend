const mongoose = require("mongoose");

module.exports = function () {
  // CONNECT TO MONGODB SERVER
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Successfully connected to mongodb"))
    .catch((e) => console.error(e));
};
