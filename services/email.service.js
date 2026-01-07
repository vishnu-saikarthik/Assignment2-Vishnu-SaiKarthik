import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Notification Service
 * Sends verification results to the user.
 */
export const sendVerificationEmail = async (recipientEmail, data) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ Email Configuration Missing. Skipping email notification.");
        return false;
    }

    // Outlook / Office365 SMTP configuration
    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false, // MUST be false for port 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App password if 2FA enabled
        },
        tls: {
            ciphers: 'SSLv3',
        },
    });

    const subject = `Document Verification Update: ${data.status}`;

    // Safe handling if verificationDetails is missing
    const rulesHtml = (data.verificationDetails || []).map(r =>
        `<li style="color: ${r.status === 'PASSED' ? 'green' : 'red'}">
            <strong>${r.rule}</strong>: ${r.status} (${r.details || 'No details'})
        </li>`
    ).join('');

    const html = `
        <h2>Document Verification Results</h2>
        <p>We have processed your uploaded <strong>${data.documentType?.toUpperCase() || 'DOCUMENT'}</strong>.</p>
        
        <h3>Summary</h3>
        <ul>
            <li><strong>Status:</strong> ${data.status}</li>
            <li><strong>Confidence Score:</strong> ${data.confidenceScore} / 1.0</li>
            <li><strong>Document Number:</strong> ${data.documentNumber || 'N/A'}</li>
        </ul>

        <h3>Detailed Checks</h3>
        <ul>
            ${rulesHtml || '<li>No verification rules available</li>'}
        </ul>

        <p>Thank you,<br/>LegalTech Verifier Team</p>
    `;

    try {
        await transporter.sendMail({
            from: `"LegalTech Verifier" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject,
            html,
        });

        console.log(`📧 Verification email sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Email Sending Failed:", error);
        return false;
    }
};
