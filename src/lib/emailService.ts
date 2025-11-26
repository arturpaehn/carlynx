import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@carlynx.us'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://carlynx.us'

export interface WelcomeEmailData {
  dealer_name: string
  activation_token: string
  free_listings: number
}

export interface PaymentFailedEmailData {
  dealer_name: string
  subscription_end_date: string
}

export interface ExpiringEmailData {
  dealer_name: string
  expiration_date: string
  days_left: number
}

export interface CancelledEmailData {
  dealer_name: string
  cancellation_date: string
}

export interface ImportErrorAlertData {
  total_rows: number
  dealers_processed: number
  errors: string[]
  timestamp: string
}

export interface ImportSuccessReportData {
  dealers_processed: number
  dealers_created: number
  listings_inserted: number
  listings_updated: number
  total_rows: number
  duration_ms: number
  timestamp: string
}

/**
 * Send import error alert to admin
 */
export async function sendImportErrorAlert(data: ImportErrorAlertData) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@carlynx.us'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DealerCenter Import Error Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #dc2626;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 Import Error Alert</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">DealerCenter Import Failed</h2>
        
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          A DealerCenter CSV import encountered errors at <strong>${new Date(data.timestamp).toLocaleString()}</strong>.
        </p>

        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: bold;">Import Summary:</p>
          <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
            <li>Total rows: ${data.total_rows}</li>
            <li>Dealers processed: ${data.dealers_processed}</li>
            <li>Errors: ${data.errors.length}</li>
          </ul>
        </div>

        <h3 style="color: #333333; margin-top: 30px;">Error Details:</h3>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto;">
          ${data.errors.map(err => `<div style="margin-bottom: 5px; color: #dc2626;">${err}</div>`).join('')}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/admin/dealercenter-logs" 
             style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
            View Full Logs
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; color: #999999; font-size: 12px;">
          © ${new Date().getFullYear()} CarLynx System Alert
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: '🚨 DealerCenter Import Error Alert',
      html
    })

    if (error) {
      console.error('[Email] Import error alert failed:', error)
      return { success: false, error }
    }

    console.log('[Email] Import error alert sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (error) {
    console.error('[Email] Import error alert exception:', error)
    return { success: false, error }
  }
}

/**
 * Send import success report to admin (optional, for monitoring)
 */
export async function sendImportSuccessReport(data: ImportSuccessReportData) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@carlynx.us'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DealerCenter Import Success</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #10b981;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Import Successful</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">DealerCenter Import Completed</h2>
        
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          CSV import completed successfully at <strong>${new Date(data.timestamp).toLocaleString()}</strong>.
        </p>

        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold;">Import Summary:</p>
          <ul style="margin: 0; padding-left: 20px; color: #065f46;">
            <li>Total rows: ${data.total_rows}</li>
            <li>Dealers processed: ${data.dealers_processed}</li>
            <li>New dealers: ${data.dealers_created}</li>
            <li>Listings inserted: ${data.listings_inserted}</li>
            <li>Listings updated: ${data.listings_updated}</li>
            <li>Duration: ${(data.duration_ms / 1000).toFixed(2)}s</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/admin/dealercenter-logs" 
             style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
            View All Logs
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; color: #999999; font-size: 12px;">
          © ${new Date().getFullYear()} CarLynx System Report
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `✅ DealerCenter Import: ${data.dealers_processed} dealers, ${data.listings_inserted + data.listings_updated} listings`,
      html
    })

    if (error) {
      console.error('[Email] Import success report failed:', error)
      return { success: false, error }
    }

    console.log('[Email] Import success report sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (error) {
    console.error('[Email] Import success report exception:', error)
    return { success: false, error }
  }
}

/**
 * Send welcome email to new DealerCenter dealer
 */
export async function sendWelcomeEmail(to: string, data: WelcomeEmailData) {
  const activationUrl = `${SITE_URL}/dealers/activate/${data.activation_token}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to CarLynx DealerCenter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to CarLynx!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hello ${data.dealer_name}! 👋</h2>
        
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          Your dealership has been successfully registered with CarLynx DealerCenter integration.
        </p>

        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-weight: bold;">
            🎁 You have <strong>${data.free_listings} free listings</strong> to get started!
          </p>
        </div>

        <p style="color: #555555; line-height: 1.6;">
          To unlock your full listing capacity and keep your vehicles visible on CarLynx, please activate your subscription:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" 
             style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Activate Subscription
          </a>
        </div>

        <p style="color: #555555; line-height: 1.6; font-size: 14px;">
          Or copy this link: <br>
          <a href="${activationUrl}" style="color: #667eea; word-break: break-all;">${activationUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

        <p style="color: #777777; font-size: 14px; line-height: 1.6;">
          If you have any questions, feel free to contact us at 
          <a href="mailto:support@carlynx.com" style="color: #667eea;">support@carlynx.com</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; color: #999999; font-size: 12px;">
          © ${new Date().getFullYear()} CarLynx. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to CarLynx DealerCenter! 🚗',
      html
    })

    if (error) {
      console.error('[Email] Welcome email failed:', error)
      return { success: false, error }
    }

    console.log('[Email] Welcome email sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (error) {
    console.error('[Email] Welcome email exception:', error)
    return { success: false, error }
  }
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(to: string, data: PaymentFailedEmailData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Failed - CarLynx</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #dc2626;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hello ${data.dealer_name},</h2>
        
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          We were unable to process your subscription payment. Your subscription will be cancelled on 
          <strong>${new Date(data.subscription_end_date).toLocaleDateString()}</strong> unless payment is updated.
        </p>

        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Action Required:</strong> Please update your payment method to avoid service interruption.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/dealer/billing" 
             style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Update Payment Method
          </a>
        </div>

        <p style="color: #777777; font-size: 14px; line-height: 1.6;">
          Need help? Contact us at 
          <a href="mailto:support@carlynx.com" style="color: #667eea;">support@carlynx.com</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; color: #999999; font-size: 12px;">
          © ${new Date().getFullYear()} CarLynx. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '⚠️ Payment Failed - Action Required',
      html
    })

    if (error) {
      console.error('[Email] Payment failed email error:', error)
      return { success: false, error }
    }

    console.log('[Email] Payment failed email sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (error) {
    console.error('[Email] Payment failed email exception:', error)
    return { success: false, error }
  }
}

/**
 * Send subscription expiring soon notification
 */
export async function sendExpiringEmail(to: string, data: ExpiringEmailData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Subscription Expiring Soon - CarLynx</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #f59e0b;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Subscription Expiring Soon</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hello ${data.dealer_name},</h2>
        
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          Your CarLynx subscription will expire in <strong>${data.days_left} days</strong> on 
          <strong>${new Date(data.expiration_date).toLocaleDateString()}</strong>.
        </p>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            After expiration, your listings will be automatically deactivated.
          </p>
        </div>

        <p style="color: #555555; line-height: 1.6;">
          To keep your vehicles visible to thousands of potential buyers, make sure your payment method is up to date.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/dealer/billing" 
             style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Renew Subscription
          </a>
        </div>

        <p style="color: #777777; font-size: 14px; line-height: 1.6;">
          Questions? Contact us at 
          <a href="mailto:support@carlynx.com" style="color: #667eea;">support@carlynx.com</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; color: #999999; font-size: 12px;">
          © ${new Date().getFullYear()} CarLynx. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `⏰ Your CarLynx subscription expires in ${data.days_left} days`,
      html
    })

    if (error) {
      console.error('[Email] Expiring email error:', error)
      return { success: false, error }
    }

    console.log('[Email] Expiring email sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (error) {
    console.error('[Email] Expiring email exception:', error)
    return { success: false, error }
  }
}

/**
 * Send subscription cancelled notification
 */
export async function sendCancelledEmail(to: string, data: CancelledEmailData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Subscription Cancelled - CarLynx</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #6b7280;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Subscription Cancelled</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hello ${data.dealer_name},</h2>
        
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          Your CarLynx subscription has been cancelled as of 
          <strong>${new Date(data.cancellation_date).toLocaleDateString()}</strong>.
        </p>

        <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            All your vehicle listings have been deactivated and are no longer visible to buyers.
          </p>
        </div>

        <p style="color: #555555; line-height: 1.6;">
          We're sorry to see you go! If you'd like to reactivate your subscription and restore your listings, 
          you can do so at any time.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/dealers/reactivate" 
             style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Reactivate Subscription
          </a>
        </div>

        <p style="color: #777777; font-size: 14px; line-height: 1.6;">
          Need assistance? Contact us at 
          <a href="mailto:support@carlynx.com" style="color: #667eea;">support@carlynx.com</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; color: #999999; font-size: 12px;">
          © ${new Date().getFullYear()} CarLynx. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your CarLynx subscription has been cancelled',
      html
    })

    if (error) {
      console.error('[Email] Cancelled email error:', error)
      return { success: false, error }
    }

    console.log('[Email] Cancelled email sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (error) {
    console.error('[Email] Cancelled email exception:', error)
    return { success: false, error }
  }
}
