import nodemailer from 'nodemailer';

interface EmailVerificationParams {
    email: string;
    token: string;
}

interface PasswordResetParams {
    email: string;
    token: string;
}

/**
 * Sends an email verification link using SMTP (e.g., Elastic Email).
 */
export async function sendVerificationEmail(params: EmailVerificationParams): Promise<void> {
    const { email, token } = params;

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465, // True for 465, false for other ports
        auth: {
            user: 'sajjadev.projects@gmail.com',
            pass: 'cmdz oxzu ydku bcrv',
        },
    });

    const mailOptions = {
        from: 'no-reply@yourdomain.com',
        to: email,
        subject: 'Verify Your Email',
        html: `
      <p>Hello,</p>
      <p>Please click the link below to verify your email:</p>
      <span>Your verification code: ${token}</span>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Email sending failed');
    }
}

/**
 * Sends a password reset link using SMTP
 */
export async function sendPasswordResetEmail(params: PasswordResetParams): Promise<void> {
    const { email, token } = params;

    // Reuse the same transporter configuration
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: 'sajjadev.projects@gmail.com',
            pass: 'cmdz oxzu ydku bcrv',
        },
    });

    const mailOptions = {
        from: 'no-reply@yourdomain.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
      <p>Hello,</p>
      <p>We received a request to reset your password. Here's your reset code:</p>
      <p><strong>${token}</strong></p>
      <p>This code will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email or contact support.</p>
      <p>Thank you,</p>
      <p>Your App Team</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Password reset email sending failed');
    }
}