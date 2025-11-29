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

bookSchema.virtual("coverImagePath").get(function () {
  if (this.coverImage != null && this.coverImageType != null) {
    return `data:${
      this.coverImageType
    };charset=utf-8;base64,${this.coverImage.toString("base64")}`;
  }
  return null;
});

module.exports = mongoose.model("Book", bookSchema);
