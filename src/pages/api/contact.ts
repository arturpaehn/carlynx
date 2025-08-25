import type { NextApiRequest, NextApiResponse } from 'next'

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
    // TODO: Здесь должна быть интеграция с email сервисом
    // Например, SendGrid, Nodemailer, или другой сервис
    console.log('Contact form submission:', { email, subject, message })
    
    // Имитация отправки письма (заглушка)
    await new Promise(resolve => setTimeout(resolve, 500))

    return res.status(200).json({ 
      message: 'Contact form submitted successfully',
      success: true 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
