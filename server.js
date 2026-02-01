import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/MongoDB.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from './routes/doctorRoute.js';
import userRouter from "./routes/userRoute.js";
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4000;

connectDB();
connectCloudinary();

app.use(express.json());

// 4. Clean CORS Configuration
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:5175', // Often used for Admin locally
  'https://doctor-booking-frontend-virid.vercel.app',
  'https://doctor-booking-admin.vercel.app'
];

// Standard middleware handles everything (including OPTIONS)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken'] // Ensure your custom headers are allowed
}));

// DO NOT ADD app.options('*') OR app.options('/:path*') HERE. 
// They are causing the PathError crash.



// 5. Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // Added for image loading
}));

// 6. API Routes
app.use("/api/admin", adminRouter);
app.use('/api/doctor', doctorRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("Prescripto Backend running successfully 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});