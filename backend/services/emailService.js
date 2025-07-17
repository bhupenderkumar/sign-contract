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

  async sendSignatureRequestEmail({ to, targetName, requesterName, contractTitle, contractId, contractUrl }) {
    // Create a simple HTML template for signature request
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Signature Request - ${contractTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .title { color: #1f2937; font-size: 20px; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .highlight { background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .contract-info { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 Digital Contract Platform</div>
              <h1 class="title">Signature Request</h1>
            </div>

            <div class="content">
              <p>Hello ${targetName},</p>

              <p><strong>${requesterName}</strong> has requested your signature on a digital contract.</p>

              <div class="contract-info">
                <h3 style="margin-top: 0; color: #1f2937;">Contract Details:</h3>
                <p><strong>Title:</strong> ${contractTitle}</p>
                <p><strong>Contract ID:</strong> ${contractId}</p>
                <p><strong>Requested by:</strong> ${requesterName}</p>
                <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div class="highlight">
                <p><strong>Action Required:</strong> Please review and sign the contract at your earliest convenience.</p>
              </div>

              <p>To review and sign the contract, please click the button below:</p>

              <div style="text-align: center;">
                <a href="${contractUrl}" class="button">Review & Sign Contract</a>
              </div>

              <p><strong>Important:</strong></p>
              <ul>
                <li>Please ensure you have your digital wallet connected</li>
                <li>Review all contract terms carefully before signing</li>
                <li>Your signature will be cryptographically verified and recorded on the blockchain</li>
                <li>Contact the requester if you have any questions about the contract</li>
              </ul>
            </div>

            <div class="footer">
              <p>This is an automated message from the Digital Contract Platform.</p>
              <p>Contract URL: <a href="${contractUrl}">${contractUrl}</a></p>
              <p>&copy; ${new Date().getFullYear()} Digital Contract Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Digital Contract Platform" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: to,
      subject: `🔐 Signature Request: ${contractTitle}`,
      html
    };

    return this.sendEmail(mailOptions);
  }

  async sendDisputeRaisedEmail(contract, dispute, recipientEmail, recipientName) {
    // Create a professional HTML template for dispute notification
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Dispute Raised - ${contract.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
            .title { color: #1f2937; font-size: 20px; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .alert { background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0; }
            .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .contract-info { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .dispute-info { background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fecaca; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚠️ Digital Contract Platform</div>
              <h1 class="title">Dispute Raised</h1>
            </div>

            <div class="content">
              <p>Hello ${recipientName},</p>

              <div class="alert">
                <p><strong>A dispute has been raised</strong> for a contract you are involved in.</p>
              </div>

              <div class="contract-info">
                <h3 style="margin-top: 0; color: #1f2937;">Contract Details:</h3>
                <p><strong>Title:</strong> ${contract.title}</p>
                <p><strong>Contract ID:</strong> ${contract.contractId}</p>
                <p><strong>Status:</strong> ${contract.status}</p>
              </div>

              <div class="dispute-info">
                <h3 style="margin-top: 0; color: #dc2626;">Dispute Information:</h3>
                <p><strong>Raised by:</strong> ${dispute.raisedByName}</p>
                <p><strong>Reason:</strong> ${dispute.reason}</p>
                <p><strong>Description:</strong> ${dispute.description}</p>
                <p><strong>Date:</strong> ${new Date(dispute.createdAt).toLocaleDateString()}</p>
              </div>

              <p>Please review the dispute details and take appropriate action. You can view the full contract and dispute information by clicking the button below:</p>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/contract/${contract.contractId}" class="button">View Contract & Dispute</a>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the dispute details carefully</li>
                <li>Gather any relevant documentation or evidence</li>
                <li>Contact the other parties to discuss resolution</li>
                <li>If a mediator is assigned, they will help facilitate resolution</li>
                <li>Respond to the dispute through the platform</li>
              </ul>

              <p>If you have any questions about this dispute or need assistance, please contact our support team.</p>
            </div>

            <div class="footer">
              <p>This is an automated message from the Digital Contract Platform.</p>
              <p>Contract URL: <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/contract/${contract.contractId}">${process.env.FRONTEND_URL || 'http://localhost:8081'}/contract/${contract.contractId}</a></p>
              <p>&copy; ${new Date().getFullYear()} Digital Contract Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Digital Contract Platform" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: recipientEmail,
      subject: `⚠️ Dispute Raised: ${contract.title}`,
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
