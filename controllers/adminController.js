import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import validator from "validator";
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import jwt from "jsonwebtoken";

// API to add a doctor
export const addDoctor = async (req, res) => {
  try {
    const { name, speciality, email, password, degree, experience, about, fees, address } = req.body;
    const image = req.file;

    if (!name || !speciality || !email || !password || !degree || !experience || !about || !fees || !address || !image) {
      return res.status(400).json({ success: false, message: "Missing Data" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const imgUpload = await cloudinary.uploader.upload(image.path, {
      folder: "doctors",
      resource_type: "image",
    });

    const imageUrl = imgUpload.secure_url;
    if (image.path) fs.unlinkSync(image.path); // Safe cleanup

    let parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;

    const newDoctor = new doctorModel({
      name, email, password: hashedPassword, image: imageUrl,
      speciality, degree, experience, about, fees,
      address: parsedAddress, date: Date.now(),
    });

    await newDoctor.save();
    return res.status(201).json({ success: true, message: "Doctor added successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7h" });
      return res.json({ success: true, token });
    }
    return res.json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Admin Dashboard with Trends
export const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const totalEarnings = appointments
      .filter((item) => item.payment || item.isCompleted)
      .reduce((acc, item) => acc + item.amount, 0);

    const specialtyData = doctors.reduce((acc, doc) => {
      acc[doc.speciality] = (acc[doc.speciality] || 0) + 1;
      return acc;
    }, {});

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const appointmentTrends = appointments.reduce((acc, app) => {
      const monthIndex = new Date(app.date).getMonth();
      const monthName = monthNames[monthIndex];
      acc[monthName] = (acc[monthName] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      dashData: {
        doctors: doctors.length,
        appointments: appointments.length,
        patients: users.length,
        totalEarnings,
        specialtyData,
        appointmentTrends,
        latestAppointments: appointments.reverse().slice(0, 5),
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Cancel Appointment (Admin Side)
export const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
        return res.json({ success: false, message: "Appointment not found" });
    }

    const { docId, slotDate, slotTime } = appointmentData;
    const docData = await doctorModel.findById(docId);

    let slots_booked = docData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter((item) => item !== slotTime);

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Fetch all doctors for admin list
export const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select("-password");
        res.json({ success: true, doctors });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Change Availability
export const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: "Availability Updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all appointments
export const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};