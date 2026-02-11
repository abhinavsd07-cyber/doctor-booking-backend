import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import validator from "validator";
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import jwt from "jsonwebtoken";

export const addDoctor = async (req, res) => {
  try {
    const {
      name,
      speciality,
      email,
      password,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;

    const image = req.file;

    // 🔴 Required field validation
    // Replace your current if block with this to see the missing field in Postman
    if (
      !name ||
      !speciality ||
      !email ||
      !password ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address ||
      !image
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Data",
        received: {
          name: !!name,
          speciality: !!speciality,
          email: !!email,
          image: !!image,
          address: !!address,
        },
      });
    }

    // 🔴 Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 🔴 Check existing doctor
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    // 🔴 Password validation
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // 🔴 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🔴 Upload image to Cloudinary
    const imgUpload = await cloudinary.uploader.upload(image.path, {
      folder: "doctors",
      resource_type: "image",
    });

    const imageUrl = imgUpload.secure_url;

    // 🔴 Remove temp file
    fs.unlinkSync(image.path);

    // 🔴 Safe address parsing
    let parsedAddress = {};
    try {
      parsedAddress = JSON.parse(address);
    } catch {
      return res.status(400).json({ message: "Invalid address format" });
    }

    // 🔴 Save doctor
    const newDoctor = new doctorModel({
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: parsedAddress,
      date: Date.now(),
    });

    await newDoctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Api for admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { email, role: "admin" }, // 👈 ADD role
        process.env.JWT_SECRET,
        { expiresIn: "7h" },
      );
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials",
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
  }
};

// Function to change doctor availability
// backend/controllers/adminController.js
export const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);

    // Flip the value: true -> false OR false -> true
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });

    res.json({ success: true, message: "Availability Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// i ==included latest appointments in dashboard data
// ✅ PROFESSIONAL ADMIN DASHBOARD: Includes Data for Charts
export const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    // 1. Calculate Total Earnings (Sum of all paid appointments)
    const totalEarnings = appointments
      .filter((item) => item.payment || item.isCompleted)
      .reduce((acc, item) => acc + item.amount, 0);

    // 2. Prepare Data for Specialty Doughnut Chart
    // This counts how many doctors are in each category (Dermatologist, etc.)
    const specialtyData = doctors.reduce((acc, doc) => {
      acc[doc.speciality] = (acc[doc.speciality] || 0) + 1;
      return acc;
    }, {});

    // 3. Prepare Data for Monthly Appointments Line Chart
    // This groups appointments by month name for the graph
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const appointmentTrends = appointments.reduce((acc, app) => {
      const monthIndex = new Date(app.date).getMonth();
      const monthName = monthNames[monthIndex];
      acc[monthName] = (acc[monthName] || 0) + 1;
      return acc;
    }, {});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      totalEarnings, // New: Shows revenue
      specialtyData, // New: For the Pie/Doughnut Chart
      appointmentTrends, // New: For the Line Chart
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.json({ success: false, message: error.message });
  }
};
// server/controllers/adminController.js

// API to get all appointments list for admin
export const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation (Admin Side)
export const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    // Release the doctor slot
    const { docId, slotDate, slotTime } = appointmentData;
    const docData = await doctorModel.findById(docId);

    let slots_booked = docData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (item) => item !== slotTime,
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
