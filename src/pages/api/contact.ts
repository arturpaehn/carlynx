import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, subject, message } = req.body

  // Валидация данных
  if (!email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  if (typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ message: 'Invalid data format' })
  }

  // Простая валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

  try {
    // Отправка письма через Resend на support@carlynx.us
    const { data, error } = await resend.emails.send({
      from: 'CarLynx Support <onboarding@resend.dev>',
      to: ['support@carlynx.us'],
      replyTo: email,
      subject: `Support Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">New Support Request from CarLynx</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This email was sent from the CarLynx support form at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend API error:', error)
      return res.status(500).json({ message: 'Failed to send email', error: error.message })
    }

    console.log('✅ Email sent successfully to support@carlynx.us:', {
      messageId: data?.id,
      from: email,
      subject,
      timestamp: new Date().toISOString()
    })

    return res.status(200).json({ 
      message: 'Email sent successfully',
      success: true,
      messageId: data?.id
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
