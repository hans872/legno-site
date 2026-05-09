import { schedules } from '@trigger.dev/sdk/v3'
import { tasks } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { classifyReplyTask } from './classify-reply'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const pollReplies = schedules.task({
  id: 'poll-replies',
  cron: '*/15 * * * *', // every 15 minutes
  maxDuration: 120,
  run: async () => {
    // Get all users with Gmail connected and sent outreach
    const { data: sentEmails } = await supabase
      .from('outreach')
      .select('id, user_id, gmail_thread_id, gmail_message_id')
      .eq('status', 'sent')
      .not('gmail_thread_id', 'is', null)

    if (!sentEmails?.length) return { checked: 0, newReplies: 0 }

    const userIds = [...new Set(sentEmails.map(e => e.user_id))]
    const { data: allCreds } = await supabase
      .from('gmail_credentials')
      .select('*')
      .in('user_id', userIds)

    const credMap = new Map(allCreds?.map(c => [c.user_id, c]) ?? [])
    let newReplies = 0

    for (const email of sentEmails) {
      const creds = credMap.get(email.user_id)
      if (!creds) continue

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

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

      try {
        const thread = await gmail.users.threads.get({
          userId: 'me',
          id: email.gmail_thread_id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })

        const messages = thread.data.messages ?? []
        // Skip the first message (the one we sent)
        const replies = messages.filter(m => m.id !== email.gmail_message_id)

        for (const msg of replies) {
          const { data: existing } = await supabase
            .from('replies')
            .select('id')
            .eq('gmail_message_id', msg.id!)
            .maybeSingle()

          if (existing) continue

          const headers = msg.payload?.headers ?? []
          const from = headers.find(h => h.name === 'From')?.value ?? ''
          const subject = headers.find(h => h.name === 'Subject')?.value ?? ''

          // Get full body
          const full = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' })
          const part = full.data.payload?.parts?.find(p => p.mimeType === 'text/plain') ?? full.data.payload
          const bodyData = part?.body?.data ?? ''
          const body = Buffer.from(bodyData, 'base64').toString('utf-8')

          const emailRegex = /<(.+?)>/.exec(from)
          const fromAddress = emailRegex ? emailRegex[1] : from
          const fromName = from.replace(/<.+?>/, '').trim().replace(/"/g, '')

          const { data: reply } = await supabase.from('replies').insert({
            user_id: email.user_id,
            outreach_id: email.id,
            gmail_message_id: msg.id!,
            from_address: fromAddress,
            from_name: fromName,
            subject,
            body: body.slice(0, 4000),
            received_at: new Date(Number(msg.internalDate)).toISOString(),
          }).select().single()

          if (reply) {
            await tasks.trigger<typeof classifyReplyTask>('classify-reply', { replyId: reply.id, userId: email.user_id })
            newReplies++
          }
        }
      } catch (err) {
        console.error(`Thread poll error for outreach ${email.id}:`, err)
      }
    }

    return { checked: sentEmails.length, newReplies }
  },
})
