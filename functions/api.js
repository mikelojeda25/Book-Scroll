const serverless = require("serverless-http");
const mongoose = require("mongoose");

// Tiyaking tama ang path na ito para ituro sa main Express app file mo (server.js)
const app = require("../server");

// 💡 DITO NANGYAYARI ANG MAGIC: Cache ang DB connection
// Gagamitin ang global variable para mag-cache ng connection sa pagitan ng Serverless calls
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
    // Tiyakin na ang connection options ay tama
    const db = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 4. I-cache ang connection object
    cachedDb = db;
    console.log("New MongoDB connection established and cached.");
    return db;
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    throw new Error("Failed to connect to database. Check MONGODB_URI.");
  }
};

// 💡 HANDLER FUNCTION: Ito ang entry point para sa Netlify Function
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
