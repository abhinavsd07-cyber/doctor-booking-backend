import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"


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


export const doctorList = async (req, res) => {
    try {
        // Find all doctors but exclude sensitive info like password and email
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// server/controllers/doctorController.js

// server/controllers/doctorController.js

// server/controllers/doctorController.js

export const doctorDashboard = async (req, res) => {
    try {
        const docId = req.docId;

        // Fetch all appointments for this doctor
        const appointments = await appointmentModel.find({ docId });

        let earnings = 0;

        // Calculate earnings only for valid, non-cancelled appointments
        appointments.map((item) => {
            if ((item.isCompleted || item.payment) && !item.cancelled) {
                earnings += item.amount;
            }
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            // Count unique patients who haven't cancelled their only appointment
            patients: Array.from(new Set(appointments.filter(item => !item.cancelled).map(item => item.userId))).length,
            latestAppointments: [...appointments].reverse().slice(0, 5)
        };

        res.json({ success: true, dashData });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// server/controllers/doctorController.js

// API to get appointments for a specific doctor
// For Appointments
export const appointmentsDoctor = async (req, res) => {
    try {
        const docId = req.docId // Use req.docId from middleware
        const appointments = await appointmentModel.find({ docId })
        res.json({ success: true, appointments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment as completed
// server/controllers/doctorController.js

export const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId; // Use authenticated ID

        const appointmentData = await appointmentModel.findById(appointmentId);

        // Verify the appointment belongs to the doctor requesting the change
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
            return res.json({ success: true, message: 'Appointment Completed' });
        }

        res.json({ success: false, message: 'Unauthorized or Appointment not found' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get doctor profile data for the logged-in doctor
// For Profile
export const doctorProfile = async (req, res) => {
    try {
        const docId = req.docId // Use req.docId from middleware
        const profileData = await doctorModel.findById(docId).select('-password')
        res.json({ success: true, profileData })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update doctor profile data
// API to update doctor profile data from Doctor Panel
// backend/controllers/doctorController.js
export const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.docId; // From authDoctor middleware
        const { fees, address, available } = req.body; // Ensure 'available' is here

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available });

        res.json({ success: true, message: "Profile Updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// server/controllers/doctorController.js

export const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId; // Authenticated ID from middleware

        const appointmentData = await appointmentModel.findById(appointmentId);

        // Verify the appointment belongs to the logged-in doctor
        if (appointmentData && appointmentData.docId === docId) {
            
            // 1. Mark the appointment as cancelled
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

            // 2. Release the slot from doctor's booked slots
            const { slotDate, slotTime } = appointmentData;
            const docData = await doctorModel.findById(docId);

            let slots_booked = docData.slots_booked;
            slots_booked[slotDate] = slots_booked[slotDate].filter(item => item !== slotTime);

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });

            return res.json({ success: true, message: 'Appointment Cancelled' });
        }

        res.json({ success: false, message: 'Cancellation Failed' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}