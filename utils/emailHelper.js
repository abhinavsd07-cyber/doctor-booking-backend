import nodemailer from 'nodemailer';

// 1. Create a persistent transporter POOL outside the function
// This stays active so you don't have to reconnect every time
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: true,          // ✅ Keep connection alive for multiple emails
    maxMessages: Infinity,
    maxConnections: 5,   // ✅ Handle multiple bookings at once
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendBookingEmail = async (userEmail, docName, date, time) => {
    // 2. Professional HTML Template with a dynamic timestamp
    // Making each email unique prevents Gmail from "threading" or blocking them
    const mailOptions = {
        from: `"Clinic Management" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Appointment Confirmed - Dr. ${docName}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #5F6FFF;">Booking Confirmation</h2>
                <p>Your appointment has been successfully scheduled.</p>
                <p><strong>Doctor:</strong> Dr. ${docName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p style="font-size: 10px; color: #aaa; margin-top: 20px;">Ref: ${Date.now()}</p>
            </div>
        `
    };

    try {
        // 3. Execute the send
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Email repeat error:", error.message);
        return false;
    }
};