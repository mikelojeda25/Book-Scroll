// models/book.js (Ang Dating Code mo)
const mongoose = require("mongoose");
const Genre = require("./genre");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    overview: {
      type: String,
    },
    //Genre ID (Referencing)
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Genre",
    },
    author: {
      type: String,
      required: true,
    },
    publishDate: {
      type: Date,
      required: true,
    },
    coverImage: {
      type: Buffer,
      required: true,
    },
    coverImageType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 💡 BAGONG CODE: Virtual Property para sa Cover Image URL
bookSchema.virtual("coverImagePath").get(function () {
  if (this.coverImage != null && this.coverImageType != null) {
    // Iko-convert ang binary data (Buffer) sa Base64 string
    return `data:${
      this.coverImageType
    };charset=utf-8;base64,${this.coverImage.toString("base64")}`;
  }
  return null; // Walang image
});

module.exports = mongoose.model("Book", bookSchema);
