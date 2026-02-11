import nodemailer from 'nodemailer';

export const sendBookingEmail = async (userEmail, docName, date, time) => {
  // 1. Create the transporter with specific Render-friendly settings
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Using 'service' is more reliable for Gmail
    host: "smtp.gmail.com",
    port: 465, 
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
    tls: {
        rejectUnauthorized: false // Helps avoid handshake errors on cloud servers
    }
  });

  // 2. The Email Logic
  const mailOptions = {
    from: `"Clinic Management" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Appointment Confirmed - Dr. ${docName}`,
    html: `<b>Date:</b> ${date}<br><b>Time:</b> ${time}` 
  };

  // 3. The Execution with error handling
  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Email error caught:", error.message);
    return false; // Return false so the main process doesn't crash
  }
};