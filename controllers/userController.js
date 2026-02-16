import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import { OAuth2Client } from "google-auth-library";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

// --- INITIALIZATION ---
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ OPTIMIZED TRANSPORTER: Explicitly set for Cloud Deployments
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL for port 465
  pool: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-digit App Password
  },
  tls: {
    rejectUnauthorized: false, // Prevents block by Render/Vercel firewalls
  },
});

// --- HELPER FUNCTIONS ---
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// ✅ IMPROVED EMAIL FUNCTION: With detailed logging
const sendConfirmationEmail = async (userData, docData, slotDate, slotTime) => {
  const mailOptions = {
    // 💡 Using exactly the ENV variable ensures Gmail recognizes the sender
    from: process.env.EMAIL_USER,
    to: userData.email,
    subject: "Appointment Confirmed! - Prescripto",
    html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #2563eb;">Appointment Confirmation</h2>
            <p>Hello <b>${userData.name}</b>,</p>
            <p>Your appointment has been successfully booked with:</p>
            <p><b>Doctor:</b> Dr. ${docData.name}</p>
            <p><b>Date:</b> ${slotDate.replaceAll("_", "/")}</p>
            <p><b>Time:</b> ${slotTime}</p>
            <br />
            <p>Thank you for choosing Prescripto!</p>
        </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully: " + info.response);
  } catch (error) {
    // 🔍 This log is your best friend. Check your Render logs for this specific line!
    console.error("❌ Email Error in Deployment:", error.message);
  }
};

// --- CONTROLLERS ---

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.json({ success: false, message: "Missing Details" });
    if (!validator.isEmail(email))
      return res.json({ success: false, message: "Valid email required" });
    if (password.length < 8)
      return res.json({ success: false, message: "Password too short" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new userModel({ name, email, password: hashedPassword });
    const user = await newUser.save();

    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API for Google Authentication
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture } = ticket.getPayload();
    let user = await userModel.findOne({ email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-8),
        10,
      );
      user = new userModel({
        name,
        email,
        password: hashedPassword,
        image: picture,
      });
      await user.save();
    }
    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: "Google Auth Failed" });
  }
};

// API to update profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, gender, dob } = req.body;
    const userId = req.userId;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender)
      return res.json({ success: false, message: "Missing Details" });

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: typeof address === "string" ? JSON.parse(address) : address,
      gender,
      dob,
    });
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      await userModel.findByIdAndUpdate(userId, {
        image: imageUpload.secure_url,
      });
    }
    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// const bookAppointment = async (req, res) => {
//   try {
//     const { docId, slotDate, slotTime } = req.body;
//     const userId = req.userId;

//     // 1. Basic Fetching (Keep this Await so we don't book a non-existent doctor)
//     const docData = await doctorModel.findById(docId).select("-password");

//     if (!docData || !docData.available) {
//       return res.json({ success: false, message: "Doctor not available" });
//     }

//     // 2. Logic Check
//     let slots_booked = docData.slots_booked || {};
//     if (slots_booked[slotDate]?.includes(slotTime)) {
//       return res.json({ success: false, message: "Slot already booked" });
//     }

//     // 3. Prepare Data
//     const userData = await userModel.findById(userId).select("-password");

//     slots_booked[slotDate] = slots_booked[slotDate]
//       ? [...slots_booked[slotDate], slotTime]
//       : [slotTime];

//     const appointmentData = new appointmentModel({
//       userId,
//       docId,
//       userData,
//       docData,
//       amount: docData.fees,
//       slotTime,
//       slotDate,
//       date: Date.now(),
//     });

//     // --- SPEED TRICK STARTS HERE ---

//     // 4. FIRE THE RESPONSE IMMEDIATELY 🚀
//     // This triggers the Toast on your frontend right now!
//     res.json({ success: true, message: "Appointment Booked Successfully" });

//     // 5. DO ALL HEAVY LIFTING IN THE BACKGROUND
//     // This runs while the user is already seeing the success toast.
//     setImmediate(async () => {
//       try {
//         // Run DB saves and Email together in the background
//         await Promise.all([
//           appointmentData.save(),
//           doctorModel.findByIdAndUpdate(docId, { slots_booked }),
//           sendConfirmationEmail(userData, docData, slotDate, slotTime),
//         ]);
//         console.log("✅ Background tasks (DB + Email) completed.");
//       } catch (err) {
//         console.error("❌ Background Task Error:", err.message);
//       }
//     });
//   } catch (error) {
//     console.log(error);
//     // If headers haven't been sent yet, send the error
//     if (!res.headersSent) {
//       res.json({ success: false, message: error.message });
//     }
//   }
// };




// API to list appointments


const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.userId;

    // 1. Fetch Doctor and User Data (Essential awaits)
    const [docData, userData] = await Promise.all([
      doctorModel.findById(docId).select("-password"),
      userModel.findById(userId).select("-password")
    ]);

    if (!docData || !docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    // 2. Logic Check
    let slots_booked = docData.slots_booked || {};
    if (slots_booked[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: "Slot already booked" });
    }

    // 3. Prepare Appointment
    slots_booked[slotDate] = slots_booked[slotDate] ? [...slots_booked[slotDate], slotTime] : [slotTime];

    const appointmentData = new appointmentModel({
      userId, docId, userData, docData,
      amount: docData.fees, slotTime, slotDate, date: Date.now(),
    });

    // 4. THE PARALLEL POWER-UP 🚀
    // We await this so the server stays alive, but it runs EVERYTHING at once.
    // This is the only way to guarantee the email sends on Render/Vercel.
    await Promise.all([
      appointmentData.save(),
      doctorModel.findByIdAndUpdate(docId, { slots_booked }),
      sendConfirmationEmail(userData, docData, slotDate, slotTime)
    ]);

    // 5. SUCCESS RESPONSE
    res.json({ success: true, message: "Appointment Booked Successfully" });

  } catch (error) {
    console.error("Booking Error:", error);
    if (!res.headersSent) {
      res.json({ success: false, message: error.message });
    }
  }
};



const listAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.userId;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData.userId !== userId)
      return res.json({ success: false, message: "Unauthorized" });

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });
    const { docId, slotDate, slotTime } = appointmentData;
    const docData = await doctorModel.findById(docId);
    let slots_booked = docData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (item) => item !== slotTime,
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API for Stripe payment
const paymentStripe = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { origin } = req.headers;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled)
      return res.json({ success: false, message: "Invalid Appointment" });

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/my-appointments?success=true&appointmentId=${appointmentData._id}`,
      cancel_url: `${origin}/my-appointments?success=false&appointmentId=${appointmentData._id}`,
      line_items: [
        {
          price_data: {
            currency: process.env.CURRENCY.toLowerCase(),
            product_data: {
              name: `Appointment with ${appointmentData.docData.name}`,
            },
            unit_amount: appointmentData.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
    });
    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to verify Stripe payment
const verifyStripe = async (req, res) => {
  try {
    const { appointmentId, success } = req.body;
    if (success === "true") {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
      });
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.userId;
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment || appointment.userId !== userId)
      return res.json({ success: false, message: "Unauthorized" });

    await appointmentModel.findByIdAndDelete(appointmentId);
    res.json({ success: true, message: "History Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  googleAuth,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentStripe,
  verifyStripe,
  deleteAppointment,
};
