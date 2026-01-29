import express from "express";
import {
  addDoctor,
  allDoctors,
  appointmentCancel,
  appointmentsAdmin,
  changeAvailability,
  loginAdmin,
} from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import { authAdmin } from "../middlewares/authAdmin.js";
import { adminDashboard } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);

adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-doctors", authAdmin, allDoctors);
// Add the route (Must be protected by authAdmin)
adminRouter.post('/change-availability', authAdmin, changeAvailability);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);

// server/routes/adminRoute.js
adminRouter.get("/dashboard", authAdmin, adminDashboard);
export default adminRouter;
