import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/MongoDB.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from './routes/doctorRoute.js';
import userRouter from "./routes/userRoute.js";
import helmet from 'helmet';

// 1. Initialize App and Port
const app = express();
const port = process.env.PORT || 4000;

// 2. Connect to External Services
connectDB(); // Ensure MONGO_URI is uppercase in your .env and connectDB file
connectCloudinary();

// 3. Middlewares
app.use(express.json());

// 4. Optimized CORS for Deployment
// In production, replace 'https://your-frontend.vercel.app' with your actual URL
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174',
  'https://doctor-booking-frontend-h0oqtp2b6-abhinavs-projects-bedf9a15.vercel.app',
  'https://doctor-booking-admin-bercbbrfd-abhinavs-projects-bedf9a15.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ADD THIS LINE: This handles the "OPTIONS" preflight check for all routes
app.options(/(.*)/, cors());

// ... rest of your code ...

// 5. Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false
}));

// 6. API Routes
app.use("/api/admin", adminRouter);
app.use('/api/doctor', doctorRouter);
app.use("/api/user", userRouter);

// 7. Health Check Route
app.get("/", (req, res) => {
  res.send("Prescripto Backend running successfully 🚀");
});

// 8. Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});