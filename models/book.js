const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // ⬅️ ITO ANG IMPORTANTE!
  },
});

module.exports = mongoose.model("Book", bookSchema);
