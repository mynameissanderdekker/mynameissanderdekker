/**
 * Builds a formal press release HTML email.
 * More structured and typographic than the newsletter template.
 */
export function buildPressEmail({
  releaseLabel,
  dateLocation,
  title,
  subject,
  intro,
  body,
  imageUrl,
  imageCaption,
  contactName,
  contactEmail,
  contactPhone,
  website,
  unsubscribeUrl,
}: {
  releaseLabel: string
  dateLocation?: string
  title: string
  subject?: string
  intro?: string
  body?: string
  imageUrl?: string
  imageCaption?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  unsubscribeUrl: string
}): string {
  const bodyHtml = body
    ? body
        .split('\n\n')
        .filter(Boolean)
        .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#222;">${p.replace(/\n/g, '<br>')}</p>`)
        .join('')
    : ''

  const contactLines = [
    contactName,
    contactEmail ? `<a href="mailto:${contactEmail}" style="color:#111;">${contactEmail}</a>` : null,
    contactPhone,
    website ? `<a href="${website}" style="color:#111;">${website}</a>` : null,
  ].filter(Boolean).join('<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f0">
<tr><td align="center" style="padding:40px 16px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fff;">

    <!-- Top label -->
    <tr>
      <td style="padding:32px 48px 0;border-top:3px solid #111;">
        <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888;">
          ${releaseLabel}
        </p>
        ${dateLocation ? `<p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#aaa;">${dateLocation}</p>` : ''}
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding:0 48px 16px;">
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.3;color:#111;">
          ${title}
        </h1>
        ${subject ? `<p style="margin:0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#777;font-style:italic;">${subject}</p>` : ''}
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:20px 48px 0;"><hr style="border:none;border-top:1px solid #e0e0e0;margin:0;"></td></tr>

    ${imageUrl ? `
    <!-- Image -->
    <tr>
      <td style="padding:24px 48px 0;">
        <img src="${imageUrl}" alt="${title}" width="504" style="max-width:100%;display:block;border:0;">
        ${imageCaption ? `<p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#aaa;">${imageCaption}</p>` : ''}
      </td>
    </tr>` : ''}

    ${intro ? `
    <!-- Intro -->
    <tr>
      <td style="padding:24px 48px 8px;">
        <p style="margin:0;font-size:17px;font-weight:600;line-height:1.6;color:#111;">${intro}</p>
      </td>
    </tr>` : ''}

    ${bodyHtml ? `
    <!-- Body -->
    <tr>
      <td style="padding:16px 48px 0;">
        ${bodyHtml}
      </td>
    </tr>` : ''}

    <!-- Contact -->
    <tr>
      <td style="padding:32px 48px 0;">
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;">Press contact</p>
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#555;line-height:1.8;">
          ${contactLines}
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:32px 48px 40px;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#bbb;line-height:1.6;">
          You are receiving this because you are in Sander Dekker's press list.<br>
          <a href="${unsubscribeUrl}" style="color:#bbb;">Unsubscribe</a>
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`
}
