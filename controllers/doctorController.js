import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendConfirmationEmail } from "../utils/emailHelper.js"

// API for doctor login
export const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const doctor = await doctorModel.findOne({ email })

        if (!doctor) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)

        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Doctor Dashboard Data
export const doctorDashboard = async (req, res) => {
    try {
        const docId = req.docId;
        const appointments = await appointmentModel.find({ docId });

        let earnings = 0;

        // Use forEach for calculations
        appointments.forEach((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: Array.from(new Set(appointments.map(item => item.userId))).length,
            latestAppointments: [...appointments].reverse().slice(0, 5)
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Mark Appointment as Completed and Notify User
export const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId.toString() === docId) {
            
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

            // Trigger Email Notification using our Helper
            const { userData, docData, slotDate, slotTime } = appointmentData;
            
            await sendConfirmationEmail(
                userData, // The helper expects userData object
                docData, 
                slotDate, 
                slotTime
            );

            return res.json({ success: true, message: 'Appointment Completed & Email Sent' });
        }

        res.json({ success: false, message: 'Mark Failed: Unauthorized' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Cancel Appointment (Doctor Side)
export const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

            // Release the slot
            const { slotDate, slotTime } = appointmentData;
            const docData = await doctorModel.findById(docId);
            
            let slots_booked = docData.slots_booked;
            slots_booked[slotDate] = slots_booked[slotDate].filter(item => item !== slotTime);

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
            return res.json({ success: true, message: 'Appointment Cancelled' });
        }

        res.json({ success: false, message: 'Cancellation Failed' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get All Appointments for Doctor
export const appointmentsDoctor = async (req, res) => {
    try {
        const docId = req.docId;
        const appointments = await appointmentModel.find({ docId });
        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get Doctor Profile
export const doctorProfile = async (req, res) => {
    try {
        const docId = req.docId;
        const profileData = await doctorModel.findById(docId).select('-password');
        res.json({ success: true, profileData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Update Doctor Profile
export const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.docId;
        const { fees, address, available } = req.body;
        await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
        res.json({ success: true, message: "Profile Updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get Public Doctor List
export const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']);
        res.json({ success: true, doctors });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}