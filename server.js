if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const indexRouter = require("./routes/index");
const bookRouter = require("./routes/books");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "10mb", extended: false }));

const mongoose = require("mongoose");
// Kunin ang Connection URI (mula sa .env) at Port
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
// Database Connection Logic gamit ang async/await
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully! 🚀");
  } catch (error) {
    console.error("MongoDB connection failed: 🛑", error.message);
    process.exit(1);
  }
};

app.use("/", indexRouter);
app.use("/books", bookRouter);

// Simulan ang Server ONLY after connecting to DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
  });
});
