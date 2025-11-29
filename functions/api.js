const serverless = require("serverless-http");
const mongoose = require("mongoose");

// Tiyakin na ang path na ito ay tama para makuha ang iyong Express app
const app = require("../server");

// Variable para i-cache ang database connection
let cachedDb = null;

const connectToDatabase = async () => {
  // 1. Kung naka-connect na, gamitin na ang cached connection
  if (cachedDb) {
    console.log("Using cached MongoDB connection.");
    return cachedDb;
  }

  // 2. Kumuha ng URI mula sa Netlify Environment Variables
  const dbUrl = process.env.MONGODB_URI;

  try {
    // 3. I-connect sa MongoDB
    // ✅ TAMANG PWESTO: Nilagay ang SSL fix sa loob ng options object
    const db = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      sslValidate: false, // <--- DITO ANG FIX, nasa loob na ng {}
    });

    // 4. I-cache ang connection object
    cachedDb = db;
    console.log("New MongoDB connection established and cached.");
    return db;
  } catch (err) {
    // Mag-log ng detalyadong error message
    console.error(`MongoDB Connection Failed: ${err.message}`);
    throw new Error(
      "Failed to connect to database. Check MONGODB_URI or SSL settings."
    );
  }
};

exports.handler = async (event, context) => {
  // Tiyakin na ang Node.js event loop ay maghihintay bago mag-exit (para sa connection caching)
  context.callbackWaitsForEmptyEventLoop = false;

  // I-connect muna sa database bago ipasa ang request sa Express app
  try {
    await connectToDatabase();

    // I-wrap ang Express app at i-execute ang request
    const handler = serverless(app);
    // I-invoke ang handler gamit ang event at context
    return handler(event, context);
  } catch (error) {
    // Kung may error sa connection, magbalik ng 500 status
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server initialization failed due to database connection issue.",
        details: error.message,
      }),
    };
  }
};
