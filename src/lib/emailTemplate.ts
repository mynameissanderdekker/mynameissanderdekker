/**
 * Builds a clean, minimal HTML email for Sander Dekker campaigns.
 * Table-based for email client compatibility.
 */

export interface EmailSection {
  heading?: string
  body?: string
  imageUrl?: string
  buttonText?: string
  buttonUrl?: string
}

export interface CalendarEvent {
  eventTitle?: string
  startDate?: string   // YYYY-MM-DD
  startTime?: string   // HH:MM
  endTime?: string     // HH:MM
  eventLocation?: string
  eventUrl?: string
}

export function buildCampaignEmail({
  heading,
  body,
  imageUrl,
  buttonText,
  buttonUrl,
  previewText,
  unsubscribeUrl,
  firstName,
  sections = [],
  calendarEvent,
}: {
  heading?: string
  body?: string
  imageUrl?: string
  buttonText?: string
  buttonUrl?: string
  previewText?: string
  unsubscribeUrl: string
  firstName?: string
  sections?: EmailSection[]
  calendarEvent?: CalendarEvent
}): string {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'

  function renderBodyText(text?: string): string {
    if (!text) return ''
    return text
      .split('\n')
      .map(line =>
        line.trim()
          ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#222;">${escHtml(line)}</p>`
          : '<p style="margin:0 0 8px;">&nbsp;</p>'
      )
      .join('\n')
  }

  function renderCtaButton(text?: string, url?: string): string {
    if (!text || !url) return ''
    return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px;">
      <tr>
        <td style="background:#111;border-radius:0;">
          <a href="${escAttr(url)}"
             style="display:inline-block;padding:14px 28px;font-size:13px;letter-spacing:1.5px;
                    text-transform:uppercase;color:#fff;text-decoration:none;font-weight:500;">
            ${escHtml(text)}
          </a>
        </td>
      </tr>
    </table>`
  }

  function renderSection(s: EmailSection, isFirst = false): string {
    return `
    ${isFirst && s.imageUrl ? `
    <tr>
      <td style="padding:0;">
        <img src="${escAttr(s.imageUrl)}" alt="${escAttr(s.heading ?? '')}"
             width="600" style="width:100%;max-width:600px;display:block;border:0;" />
      </td>
    </tr>` : ''}
    <tr>
      <td style="padding:${isFirst ? '40px 40px 8px' : '32px 40px 8px'};${!isFirst ? 'border-top:1px solid #ebebeb;' : ''}">
        ${s.heading ? `<h2 style="margin:0 0 20px;font-size:${isFirst ? '26px' : '20px'};font-weight:400;line-height:1.3;color:#111;letter-spacing:-0.3px;">
          ${escHtml(s.heading)}
        </h2>` : ''}
        ${isFirst ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:#555;">${escHtml(greeting)}</p>` : ''}
        ${renderBodyText(s.body)}
        ${!isFirst && s.imageUrl ? `
        <div style="margin:20px 0;">
          <img src="${escAttr(s.imageUrl)}" alt="${escAttr(s.heading ?? '')}"
               width="520" style="max-width:100%;display:block;border:0;" />
        </div>` : ''}
        ${renderCtaButton(s.buttonText, s.buttonUrl)}
      </td>
    </tr>`
  }

  function renderCalendarEvent(ev: CalendarEvent): string {
    if (!ev.eventTitle || !ev.startDate) return ''

    // Build Google Calendar URL
    const [y, m, d] = ev.startDate.split('-')
    const startTimeClean = (ev.startTime ?? '00:00').replace(':', '')
    const endTimeClean   = (ev.endTime   ?? '23:59').replace(':', '')
    const gcStart = `${y}${m}${d}T${startTimeClean}00`
    const gcEnd   = `${y}${m}${d}T${endTimeClean}00`
    const gcUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(ev.eventTitle)}` +
      `&dates=${gcStart}/${gcEnd}` +
      (ev.eventLocation ? `&location=${encodeURIComponent(ev.eventLocation)}` : '') +
      (ev.eventUrl ? `&details=${encodeURIComponent(ev.eventUrl)}` : '')

    const formattedDate = new Date(`${ev.startDate}T${ev.startTime ?? '00:00'}`).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    return `
    <tr>
      <td style="padding:24px 40px 32px;border-top:1px solid #ebebeb;background:#fafafa;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#999;">Agenda</p>
        <p style="margin:0 0 2px;font-size:16px;font-weight:500;color:#111;">${escHtml(ev.eventTitle)}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#666;">
          ${escHtml(formattedDate)}${ev.startTime ? `, ${ev.startTime}` : ''}${ev.endTime ? ` – ${ev.endTime}` : ''}
          ${ev.eventLocation ? `<br>${escHtml(ev.eventLocation)}` : ''}
        </p>
        <a href="${escAttr(gcUrl)}" target="_blank"
           style="display:inline-block;padding:10px 20px;font-size:12px;letter-spacing:1px;
                  text-transform:uppercase;color:#111;text-decoration:none;border:1px solid #111;">
          + Voeg toe aan agenda
        </a>
      </td>
    </tr>`
  }

  const firstSection: EmailSection = { heading, body, imageUrl, buttonText, buttonUrl }
  const allSections = [firstSection, ...sections]

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escHtml(heading ?? 'Sander Dekker')}</title>
  ${previewText ? `<!--[if !mso]><!-->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escHtml(previewText)}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  <!--<![endif]-->` : ''}
</head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#fff;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 40px 24px;border-bottom:1px solid #ebebeb;">
              <a href="https://mynameissanderdekker.com" style="text-decoration:none;">
                <span style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999;font-weight:400;">
                  Sander Dekker
                </span>
              </a>
            </td>
          </tr>

          ${allSections.map((s, i) => renderSection(s, i === 0)).join('\n')}

          ${calendarEvent?.eventTitle ? renderCalendarEvent(calendarEvent) : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 36px;border-top:1px solid #ebebeb;">
              <p style="margin:0 0 12px;">
                <a href="https://instagram.com/mynameissanderdekker"
                   style="font-size:12px;color:#aaa;text-decoration:none;margin-right:12px;">Instagram</a>
                <a href="https://mynameissanderdekker.com"
                   style="font-size:12px;color:#aaa;text-decoration:none;">Website</a>
              </p>
              <p style="margin:0;font-size:12px;color:#ccc;line-height:1.6;">
                Je ontvangt deze mail omdat je op de lijst van Sander Dekker staat.<br />
                <a href="${escAttr(unsubscribeUrl)}"
                   style="color:#ccc;text-decoration:underline;">Uitschrijven</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
