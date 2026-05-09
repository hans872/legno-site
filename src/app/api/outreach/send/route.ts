import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

function makeRawMessage(to: string, from: string, subject: string, body: string): string {
  const msg = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `MIME-Version: 1.0`,
    '',
    body,
  ].join('\r\n')
  return Buffer.from(msg).toString('base64url')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { outreachId, to } = await request.json()

  const [credsResult, outreachResult] = await Promise.all([
    supabase.from('gmail_credentials').select('*').eq('user_id', user.id).single(),
    supabase.from('outreach').select('*, permits(*)').eq('id', outreachId).eq('user_id', user.id).single(),
  ])

  if (credsResult.error || !credsResult.data) {
    return NextResponse.json({ error: 'Gmail not connected. Please connect Gmail in Settings.' }, { status: 400 })
  }
  if (outreachResult.error || !outreachResult.data) {
    return NextResponse.json({ error: 'Outreach not found' }, { status: 404 })
  }

  const creds = credsResult.data
  const outreach = outreachResult.data

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
  oauth2Client.setCredentials({
    access_token: creds.access_token,
    refresh_token: creds.refresh_token,
    expiry_date: creds.expiry_date,
  })

  const tokens = await oauth2Client.getAccessToken()
  if (tokens.token && tokens.token !== creds.access_token) {
    await supabase.from('gmail_credentials').update({
      access_token: tokens.token,
    }).eq('user_id', user.id)
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const raw = makeRawMessage(to, creds.gmail_address, outreach.subject, outreach.body)

  const sent = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })

  const gmailMessageId = sent.data.id ?? ''
  const gmailThreadId = sent.data.threadId ?? ''

  await supabase.from('outreach').update({
    to_address: to,
    gmail_message_id: gmailMessageId,
    gmail_thread_id: gmailThreadId,
    status: 'sent',
    sent_at: new Date().toISOString(),
  }).eq('id', outreachId)

  return NextResponse.json({ ok: true, gmailMessageId, gmailThreadId })
}
