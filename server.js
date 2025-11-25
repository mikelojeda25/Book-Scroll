// server.js (FINAL, CLEANED-UP VERSION)

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");

// --- 💡 MIDDLEWARE SETUP ---
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(express.static("public"));

// Built-in Body Parser: Body parser para sa form data
app.use(express.urlencoded({ limit: "10mb", extended: false }));

// --- 🔗 DATABASE CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI;

// 1. Connection Event Handlers (Para mas malinis ang logging)
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully! 🚀");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection failed: 🛑", err.message);
  process.exit(1); // Ipi-pilit i-exit ang app kapag nag-fail
});

// 2. Mongoose Connect Logic
mongoose.connect(MONGODB_URI);

// --- 🛣️ ROUTE SETUP ---
const indexRouter = require("./routes/index");
const bookRouter = require("./routes/books");

// Kailangan i-define ang routes PAGKATAPOS ng middleware at DB connection
app.use("/", indexRouter);
app.use("/books", bookRouter);

// --- ⚙️ SERVER START ---
const PORT = process.env.PORT || 3000;

// Hindi na kailangan ng connectDB().then(() => { ... });
// Diretso na tayong mag-listen!
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
