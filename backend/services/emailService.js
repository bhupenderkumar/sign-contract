const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    // Configure email transporter to use Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY environment variable is required but not set');
      throw new Error('Email service configuration error: RESEND_API_KEY is required');
    }

    if (resendApiKey && resendApiKey !== 'your-resend-api-key') {
      // Use Resend SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: resendApiKey
        }
      });
      console.log('📧 Email service initialized with Resend SMTP');
    } else {
      // Fallback to console logging for development
      console.log('📧 No Resend API key found, using console logging');
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 Email would be sent:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            from: mailOptions.from
          });
          return { messageId: 'console-' + Date.now() };
        }
      };
    }
  }

  async loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');
      
      // Replace variables in template
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, variables[key]);
      });
      
      return template;
    } catch (error) {
      console.error(`Failed to load email template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName, variables);
    }
  }

  getDefaultTemplate(templateName, variables) {
    // Fallback templates if file loading fails
    const templates = {
      contractCreated: `
        <h2>New Contract Created: ${variables.contractTitle}</h2>
        <p>Dear ${variables.recipientName},</p>
        <p>A new digital contract has been created and requires your signature.</p>
        <p><strong>Contract Details:</strong></p>
        <ul>
          <li>Title: ${variables.contractTitle}</li>
          <li>Contract ID: ${variables.contractId}</li>
          <li>Created by: ${variables.creatorName}</li>
        </ul>
        <p>Please review and sign the contract at: <a href="${variables.contractUrl}">View Contract</a></p>
      `,
      contractSigned: `
        <h2>Contract Signed: ${variables.contractTitle}</h2>
        <p>Dear ${variables.recipientName},</p>
        <p>${variables.signerName} has signed the contract "${variables.contractTitle}".</p>
        <p>Contract ID: ${variables.contractId}</p>
        <p>View contract status: <a href="${variables.contractUrl}">View Contract</a></p>
      `,
      contractCompleted: `
        <h2>Contract Completed: ${variables.contractTitle}</h2>
        <p>Dear ${variables.recipientName},</p>
        <p>All parties have signed the contract "${variables.contractTitle}". The contract is now fully executed.</p>
        <p>Contract ID: ${variables.contractId}</p>
        <p>View final contract: <a href="${variables.contractUrl}">View Contract</a></p>
      `
    };
    
    return templates[templateName] || `<p>Email notification for ${templateName}</p>`;
  }

  async sendContractCreatedEmail(contract, recipientEmail, recipientName) {
    const variables = {
      recipientName,
      contractTitle: contract.title,
      contractId: contract.contractId,
      creatorName: contract.parties[0].name,
      contractUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${contract.contractId}`,
      contractDescription: contract.description || 'No description provided'
    };

    const html = await this.loadTemplate('contractCreated', variables);

    const mailOptions = {
      from: `"Digital Contract Platform" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: recipientEmail,
      subject: `New Contract Requires Your Signature: ${contract.title}`,
      html
    };

    return this.sendEmail(mailOptions);
  }

  async sendContractSignedEmail(contract, signerName, recipientEmail, recipientName) {
    const variables = {
      recipientName,
      contractTitle: contract.title,
      contractId: contract.contractId,
      signerName,
      contractUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${contract.contractId}`
    };

    const html = await this.loadTemplate('contractSigned', variables);

    const mailOptions = {
      from: `"Digital Contract Platform" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: recipientEmail,
      subject: `Contract Signed: ${contract.title}`,
      html
    };

    return this.sendEmail(mailOptions);
  }

  async sendContractCompletedEmail(contract, recipientEmail, recipientName) {
    const variables = {
      recipientName,
      contractTitle: contract.title,
      contractId: contract.contractId,
      contractUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${contract.contractId}`
    };

    const html = await this.loadTemplate('contractCompleted', variables);

    const mailOptions = {
      from: `"Digital Contract Platform" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: recipientEmail,
      subject: `Contract Completed: ${contract.title}`,
      html
    };

    return this.sendEmail(mailOptions);
  }

  async sendEmail(mailOptions) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', info.messageId);
      
      // Log preview URL for development
      if (process.env.NODE_ENV !== 'production' && info.messageId.startsWith('test-') === false) {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('📧 Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
