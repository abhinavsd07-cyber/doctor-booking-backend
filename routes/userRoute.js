import express from "express";
import { registerUser, loginUser, getProfile, googleAuth, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentStripe, verifyStripe, deleteAppointment } from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from '../middlewares/multer.js'; // Added the 's'


const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post("/google-auth", googleAuth);
userRouter.post("/update-profile", authUser, upload.single('image'), updateProfile);
// ... other routes
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
// server/routes/userRoute.js
userRouter.post('/delete-appointment', authUser, deleteAppointment); // <--- Verify this line// --- ADD THESE TWO LINES ---
// Add these lines

userRouter.post('/payment-stripe', authUser, paymentStripe);
userRouter.post('/verify-stripe', authUser, verifyStripe);
export default userRouter;