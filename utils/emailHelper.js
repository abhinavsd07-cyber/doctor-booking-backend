import nodemailer from 'nodemailer';

export const sendBookingEmail = async (userEmail, docName, date, time) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,         // ✅ CHANGE from 587 to 465
    secure: true,      // ✅ CHANGE from false to true
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Must be 16-character App Password
    },
    // Adding a connection timeout to prevent hanging
    connectionTimeout: 10000, 
  });

  try {
    await transporter.sendMail({
      from: `"Clinic Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Appointment Confirmed!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #5F6FFF; text-align: center;">Booking Confirmed</h2>
          <p>Your appointment with <strong>Dr. ${docName}</strong> is scheduled for:</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          <p style="font-size: 12px; color: #777;">If you did not make this booking, please contact us immediately.</p>
        </div>
      `,
    });
    console.log("✅ Email sent to:", userEmail);
  } catch (error) {
    // This logs the error so you can see it on Render, but doesn't crash the server
    console.error("❌ Notification Error:", error.message);
  }
};