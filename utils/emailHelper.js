import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: true,
    maxMessages: Infinity,
    maxConnections: 5,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// FIXED: Accepting the objects passed from the controller
export const sendConfirmationEmail = async (userData, docData, date, time) => {
    
    // Extract the actual email string and doctor name from the objects
    const userEmail = userData.email; 
    const docName = docData.name;

    const mailOptions = {
        from: `"Clinic Management" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Appointment Confirmed - Dr. ${docName}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #5F6FFF;">Booking Confirmation</h2>
                <p>Hello <strong>${userData.name}</strong>,</p>
                <p>Your appointment has been successfully scheduled.</p>
                <p><strong>Doctor:</strong> Dr. ${docName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p style="font-size: 10px; color: #aaa; margin-top: 20px;">Ref: ${Date.now()}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to: ${userEmail}`);
        return true;
    } catch (error) {
        // Log the error but don't let it crash the main thread
        console.error("❌ Email error:", error.message);
        return false;
    }
};