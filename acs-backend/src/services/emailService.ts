import { logger } from '@/config/logger';
import { config } from '@/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PasswordResetEmailOptions {
  to: string;
  userName: string;
  username: string;
  newPassword: string;
  resetByAdmin: boolean;
}

class EmailService {
  private isEmailEnabled: boolean;

  constructor() {
    // Check if email service is configured
    this.isEmailEnabled = !!(
      process.env.EMAIL_SERVICE_ENABLED === 'true' &&
      process.env.EMAIL_FROM &&
      (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY)
    );

    if (!this.isEmailEnabled) {
      logger.warn('Email service is not configured. Emails will be logged instead of sent.');
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isEmailEnabled) {
      // Log email instead of sending when not configured
      logger.info('Email would be sent (service not configured):', {
        to: options.to,
        subject: options.subject,
        textPreview: options.text?.substring(0, 100) + '...'
      });
      return;
    }

    try {
      // In a real implementation, you would use:
      // - nodemailer with SMTP
      // - SendGrid API
      // - AWS SES
      // - Other email service providers
      
      await this.sendEmailViaProvider(options);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Email delivery failed');
    }
  }

  /**
   * Send password reset email with formatted template
   */
  async sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<void> {
    const subject = 'Password Reset - CRM System';
    
    const html = this.generatePasswordResetEmailHTML(options);
    const text = this.generatePasswordResetEmailText(options);

    await this.sendEmail({
      to: options.to,
      subject,
      html,
      text
    });
  }

  /**
   * Generate HTML template for password reset email
   */
  private generatePasswordResetEmailHTML(options: PasswordResetEmailOptions): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - CRM System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 5px 5px;
        }
        .password-box {
            background-color: #e9ecef;
            border: 2px solid #007bff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-family: monospace;
            font-size: 18px;
            text-align: center;
            font-weight: bold;
        }
        .warning {
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CRM System</h1>
        <h2>Password Reset Notification</h2>
    </div>
    
    <div class="content">
        <p>Dear ${options.userName},</p>
        
        <p>Your password has been reset by a system administrator. Please use the following credentials to log in:</p>
        
        <p><strong>Username:</strong> ${options.username}</p>
        
        <div class="password-box">
            New Password: ${options.newPassword}
        </div>
        
        <div class="warning">
            <strong>Important Security Instructions:</strong>
            <ul>
                <li>Please log in immediately and change this password</li>
                <li>Do not share this password with anyone</li>
                <li>Choose a strong, unique password for your new password</li>
                <li>If you did not request this password reset, contact your administrator immediately</li>
            </ul>
        </div>
        
        <p>For security reasons, this email contains sensitive information. Please delete this email after you have successfully changed your password.</p>
        
        <p>If you have any questions or concerns, please contact your system administrator.</p>
        
        <p>Best regards,<br>CRM System Administration</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text version for password reset email
   */
  private generatePasswordResetEmailText(options: PasswordResetEmailOptions): string {
    return `
CRM System - Password Reset Notification

Dear ${options.userName},

Your password has been reset by a system administrator.

Login Credentials:
Username: ${options.username}
New Password: ${options.newPassword}

IMPORTANT SECURITY INSTRUCTIONS:
- Please log in immediately and change this password
- Do not share this password with anyone
- Choose a strong, unique password for your new password
- If you did not request this password reset, contact your administrator immediately

For security reasons, please delete this email after you have successfully changed your password.

If you have any questions or concerns, please contact your system administrator.

Best regards,
CRM System Administration

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} CRM System. All rights reserved.
    `;
  }

  /**
   * Mock email sending function - replace with actual email service implementation
   */
  private async sendEmailViaProvider(options: EmailOptions): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (process.env.NODE_ENV === 'development') {
      // In development, log the full email content
      logger.info('=== EMAIL CONTENT (DEVELOPMENT) ===', {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
    }

    // Here you would implement actual email sending:
    /*
    Example with nodemailer:
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    */

    /*
    Example with SendGrid:
    
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: options.to,
      from: process.env.EMAIL_FROM,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    */
  }
}

export const emailService = new EmailService();