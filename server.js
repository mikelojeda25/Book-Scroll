// server.js (FINAL, CLEANED-UP VERSION)

// Gumamit ng path module para sa absolute pathing
const path = require("path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");

// --- 💡 MIDDLEWARE SETUP -----------------------------------------------------
app.set("view engine", "ejs");

// 🛑 FIX: Gamitin ang path.join at i-reference ang root directory para mahanap ang views folder
// Sa serverless, ang __dirname ay tumuturo sa function folder. Kaya ang pinaka-safe na path ay __dirname + '/../..' + '/views'
// PERO, dahil ang server.js ay nasa root, path.join(__dirname, 'views') ay dapat gumana kung tama ang Netlify build.
// Gamitin natin ang pinaka-simpleng fix para sa Netlify:
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ limit: "10mb", extended: false }));

// Para huwag i-cache ang pages (lalo na pag nagba-back)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// --- 🔗 DATABASE CONNECTION ----------------------------------------------------
// 🛑 TINANGGAL ANG DATABASE CONNECTION DITO!
// Nilipat natin ito sa functions/api.js para mag-trigger BAGO i-execute ang handler.
const mongoose = require("mongoose");
global.Book = require("./models/book"); // I-load ang models para ma-recognize ng routes

// --- 🛣️ ROUTE SETUP ---
const indexRouter = require("./routes/index");
const bookRouter = require("./routes/books");

// Kailangan i-define ang routes PAGKATAPOS ng middleware at DB connection
app.use("/", indexRouter);
app.use("/books", bookRouter);

// --- ⚙️ SERVER START --------------------------------------------------------
const PORT = process.env.PORT || 3000;

// 💡 1. Balutin ang app.listen sa condition (GINAWA MO NA ITO - GOOD!)
// Ito ay para hindi mag-error ang Netlify na "Port already in use"
if (process.env.NODE_ENV !== "production") {
  // 🛑 Dito lang magko-connect sa DB kung LOCAL
  const MONGODB_URI = process.env.MONGODB_URI;
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully! 🚀");
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection failed: 🛑", err.message);
    process.exit(1);
  });

  app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
  });
}

// 💡 2. IMPORTANTE: I-export ang app! (GINAWA MO NA ITO - GOOD!)
module.exports = app;
