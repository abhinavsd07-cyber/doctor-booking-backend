import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/MongoDB.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from './routes/doctorRoute.js'

import userRouter from "./routes/userRoute.js";
import helmet from 'helmet';

// Define the allowed origins (User App and Admin App)
const allowedOrigins = [
  'http://localhost:5173', // User Frontend
  'http://localhost:5174'  // Admin Panel
];

const app = express();
const port = process.env.PORT || 4000;

// Connect to Services
connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Enhanced CORS to allow Stripe redirects and your local frontend
app.use(cors(corsOptions));

// Loosen the policy so the browser allows connections to your own server
app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false
}));

// API Routes
app.use("/api/admin", adminRouter);
app.use('/api/doctor', doctorRouter)
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});