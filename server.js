const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const sanitize = require("mongo-sanitize");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

// Load environment variables
dotenv.config();

// Global database connection cache for serverless
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variable
    const corsOrigins = process.env.CORS_ORIGINS || "http://localhost:3000";
    const allowedOrigins = corsOrigins
      .split(",")
      .map((origin) => origin.trim());

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Cookie parsing middleware
app.use(cookieParser());

// CSRF protection disabled for API routes
// Note: CORS with proper origin validation provides CSRF protection for APIs

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Data sanitization against MongoDB injection
app.use((req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }
  // Sanitize request params
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
// app.use("/api/blogs", require("./routes/blog"));
// app.use("/api/events", require("./routes/event"));
app.use("/api/gallery", require("./routes/gallery"));
// app.use("/api/hero-sliders", require("./routes/heroSlider"));
// app.use("/api/works", require("./routes/work"));
// app.use("/api/services", require("./routes/service"));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Maheesh Portfolio Backend API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// For Vercel serverless functions, export the app directly
// For local development, you can still run with node server.js
if (require.main === module) {
  // Local development
  const PORT = process.env.PORT || 5000;
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

// Export for Vercel serverless functions
module.exports = app;
