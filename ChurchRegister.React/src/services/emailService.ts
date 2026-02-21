/**
 * Email service for sending attendance analytics reports
 */
export interface EmailRequest {
  toEmail: string;
  subject: string;
  body: string;
  attachment?: File | Blob;
  attachmentName?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

/**
 * Send an email with PDF attachment
 */
export const sendEmailWithAttachment = async (
  request: EmailRequest
): Promise<EmailResponse> => {
  try {
    const formData = new FormData();
    formData.append('toEmail', request.toEmail);
    formData.append('subject', request.subject);
    formData.append('body', request.body);

    if (request.attachment) {
      formData.append(
        'attachment',
        request.attachment,
        request.attachmentName || 'attachment.pdf'
      );
    }

    const response = await fetch('/api/email/send-report', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
};

/**
 * Validate email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Generate standard email body for attendance report
 */
export const generateReportEmailBody = (eventCount: number): string => {
  return `Dear Recipient,

Please find attached the Church Attendance Analytics Report generated on ${new Date().toLocaleDateString()}.

This comprehensive report includes:
• Monthly attendance averages for ${eventCount} events
• Visual charts showing attendance trends over the last 12 months
• Statistical summaries for each event

The data covers attendance patterns and helps identify trends in church participation. Each chart displays the average attendance for each month along with relevant statistics.

If you have any questions about this report, please don't hesitate to reach out.

Blessings,
Church Register System`;
};
