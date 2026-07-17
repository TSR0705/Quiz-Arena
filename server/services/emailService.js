import dotenv from 'dotenv';
dotenv.config();

class ConsoleEmailProvider {
  async sendPasswordResetEmail(email, resetUrl) {
    console.log('==================================================');
    console.log(`[EMAIL DEV MOCK] To: ${email}`);
    console.log(`[EMAIL DEV MOCK] Subject: Password Reset Request`);
    console.log(`[EMAIL DEV MOCK] Link: ${resetUrl}`);
    console.log('==================================================');
  }
}

class SendGridEmailProvider {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    if (!this.apiKey || this.apiKey.trim() === '') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'FATAL: SENDGRID_API_KEY is required in production but is missing or empty. ' +
          'Set the SENDGRID_API_KEY environment variable before starting the server.'
        );
      }
    }
    this.fromEmail = process.env.EMAIL_FROM || 'no-reply@quizarena.com';
  }

  async sendPasswordResetEmail(email, resetUrl) {
    // In production, send a real REST request to SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: this.fromEmail, name: 'QuizArena' },
        subject: 'Password Reset Request',
        content: [{
          type: 'text/html',
          value: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`SendGrid API error: ${response.statusText} - ${errBody}`);
    }
  }
}

const emailService = process.env.NODE_ENV === 'production' 
  ? new SendGridEmailProvider() 
  : new ConsoleEmailProvider();

export default emailService;
