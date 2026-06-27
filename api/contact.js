import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, nachricht, elapsed, website } = req.body

  // Honeypot
  if (website) return res.status(200).json({ ok: true })
  // Dwell time
  if (!elapsed || elapsed < 3) return res.status(400).json({ error: 'Too fast' })
  // Required fields
  if (!name || !email || !nachricht) return res.status(400).json({ error: 'Missing fields' })
  // Content filter
  if (nachricht.split(' ').some(w => w.length > 60)) return res.status(400).json({ error: 'Spam' })
  // Name length
  if (name.length > 80) return res.status(400).json({ error: 'Spam' })
  // Email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' })

  try {
    await resend.emails.send({
      from: process.env.CONTACT_FROM || 'noreply@pan21.com',
      to: 'linhart@pan21.com',
      replyTo: email,
      subject: 'Nachricht von linhart-online.com – ' + name,
      html: `
        <h2>Neue Nachricht über linhart-online.com</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold;width:100px">Name:</td><td style="padding:8px">${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">E-Mail:</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Nachricht:</td><td style="padding:8px">${nachricht.replace(/\n/g, '<br>')}</td></tr>
        </table>
        <p style="color:#999;font-size:12px;margin-top:24px">Gesendet über linhart-online.com | Verweildauer: ${elapsed}s</p>
      `,
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Resend error:', err)
    return res.status(500).json({ error: 'Mail send failed' })
  }
}
