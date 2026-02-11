import nodemailer from 'nodemailer';

export const sendBookingEmail = async (userEmail, docName, date, time) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // ✅ Use 465 for SSL (more stable on Render)
    secure: true, // ✅ Must be true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
    // ✅ Add timeout settings to prevent the server from hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
  });

  try {
    await transporter.sendMail({
      from: `"Clinic Support" <${process.env.EMAIL_USER}>`, // Professional sender name
      to: userEmail,
      subject: "Appointment Confirmed!",
      text: `Your appointment with Dr. ${docName} on ${date} at ${time} is confirmed.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #5F6FFF;">Appointment Confirmed!</h2>
          <p>Dear Patient, your booking is successful.</p>
          <p><strong>Doctor:</strong> Dr. ${docName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <hr />
          <p style="font-size: 12px; color: #888;">Thank you for using our clinic services.</p>
        </div>
      `, // Added HTML for that "industrial" look
    });
    console.log("✅ Email sent successfully to:", userEmail);
  } catch (error) {
    console.error("❌ Email failed but process continuing:", error.message);
    // We catch the error so the booking still works even if the email fails
  }
};