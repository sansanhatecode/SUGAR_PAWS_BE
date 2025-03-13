import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, code): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: '✨ Your Verification Code! ✨',
      text: `Hello! Your verification code is: ${code}. Thank you for joining our community!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Your Verification Code</title>
            <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #FFD1DC; font-family: Poppins, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              <h2 style="text-align: center; color: #FE6E94; font-family: 'Jua', cursive; font-size: 36px; margin: 0 0 10px;">
                Sugar Paws
              </h2>
              <h3 style="text-align: center; color: #331048; margin: 10px 0;">
                Hello, Sunshine!
              </h3>
              <p style="font-size: 14px; color: #353535; text-align: center; margin: 20px 0;">
                We're absolutely thrilled to have you here! Your verification code is:
              </p>
              <div style="font-size: 32px; font-weight: bold; color: #FE6E94; text-align: center">
                ${code}
              </div>
              <p style="font-size: 14px; color: #353535; margin: 20px 0;">
                If you didn't request this, please ignore this email. Otherwise, enjoy your day and welcome aboard!
              </p>
              <p style="font-size: 14px; color: #353535; text-align: right; margin: 20px 0 0;">
                Cheers,<br/>
                <span style="font-family: cursive, sans-serif;">The Sugar Paws Team 🐾</span>
              </p>
            </div>
          </body>
        </html>
      `,
    });
  }
}
