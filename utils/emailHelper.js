import nodemailer from 'nodemailer';

export const sendBookingEmail = async (userEmail, docName, date, time) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Or your provider
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use an "App Password"
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Appointment Confirmed!",
    text: `Your appointment with Dr. ${docName} on ${date} at ${time} is confirmed.`,
  });
};