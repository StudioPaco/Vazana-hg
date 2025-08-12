// Email service using Resend (you can switch to SendGrid or other providers)
interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

interface JobNotificationData {
  jobNumber: string
  clientName: string
  workerName: string
  jobDate: string
  site: string
  workType: string
  totalAmount: string
}

export class EmailService {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || ""
    this.fromEmail = process.env.FROM_EMAIL || "noreply@vazana-studio.com"
  }

  async sendEmail({ to, subject, html, from }: EmailOptions) {
    if (!this.apiKey) {
      console.warn("Email service not configured - RESEND_API_KEY missing")
      return { success: false, error: "Email service not configured" }
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: from || this.fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Email API error: ${error}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to send email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Job assignment notification
  async sendJobAssignmentNotification(workerEmail: string, jobData: JobNotificationData) {
    const subject = `New Job Assignment - Job #${jobData.jobNumber}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">New Job Assignment</h2>
          <p style="color: #6b7280; margin: 5px 0 0 0;">You have been assigned to a new job</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin-top: 0;">Job Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Job Number:</td>
              <td style="padding: 8px 0; color: #6b7280;">#${jobData.jobNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Client:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.clientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.jobDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Location:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.site}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Work Type:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.workType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
              <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">₪${jobData.totalAmount}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Important:</strong> Please confirm your availability for this job assignment.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from Vazana Studio<br>
            וזאנה אבטחת כבישים
          </p>
        </div>
      </div>
    `

    return this.sendEmail({
      to: workerEmail,
      subject,
      html,
    })
  }

  // Job completion notification
  async sendJobCompletionNotification(clientEmail: string, jobData: JobNotificationData) {
    const subject = `Job Completed - Job #${jobData.jobNumber}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #16a34a; margin: 0;">Job Completed</h2>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Your job has been successfully completed</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin-top: 0;">Job Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Job Number:</td>
              <td style="padding: 8px 0; color: #6b7280;">#${jobData.jobNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Worker:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.workerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.jobDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Location:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.site}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Work Type:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.workType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Total Amount:</td>
              <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">₪${jobData.totalAmount}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Next Steps:</strong> An invoice will be sent separately for payment processing.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for choosing Vazana Studio<br>
            תודה שבחרתם בוזאנה אבטחת כבישים
          </p>
        </div>
      </div>
    `

    return this.sendEmail({
      to: clientEmail,
      subject,
      html,
    })
  }

  // Payment reminder notification
  async sendPaymentReminder(clientEmail: string, jobData: JobNotificationData, daysOverdue: number) {
    const subject = `Payment Reminder - Job #${jobData.jobNumber}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0;">Payment Reminder</h2>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Payment is ${daysOverdue} days overdue</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin-top: 0;">Outstanding Payment</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Job Number:</td>
              <td style="padding: 8px 0; color: #6b7280;">#${jobData.jobNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Service Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.jobDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Location:</td>
              <td style="padding: 8px 0; color: #6b7280;">${jobData.site}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount Due:</td>
              <td style="padding: 8px 0; color: #dc2626; font-weight: bold; font-size: 18px;">₪${jobData.totalAmount}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Please arrange payment at your earliest convenience.</strong><br>
            For any questions regarding this invoice, please contact us directly.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Vazana Studio - Road Safety Services<br>
            וזאנה אבטחת כבישים
          </p>
        </div>
      </div>
    `

    return this.sendEmail({
      to: clientEmail,
      subject,
      html,
    })
  }
}

export const emailService = new EmailService()
