import express from 'express'
import { loginDoctor, appointmentsDoctor, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile,doctorList, appointmentCancel } from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'

const doctorRouter = express.Router()

doctorRouter.get('/list', doctorList) // <--- Add this public route
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete)
// server/routes/doctorRoute.js
doctorRouter.get('/dashboard', authDoctor, doctorDashboard);
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile);
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel);
export default doctorRouter