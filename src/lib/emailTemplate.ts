/**
 * Builds a clean, minimal HTML email for Sander Dekker campaigns.
 * Table-based for email client compatibility.
 */
export function buildCampaignEmail({
  heading,
  body,
  imageUrl,
  buttonText,
  buttonUrl,
  previewText,
  unsubscribeUrl,
  firstName,
}: {
  heading?: string
  body?: string
  imageUrl?: string
  buttonText?: string
  buttonUrl?: string
  previewText?: string
  unsubscribeUrl: string
  firstName?: string
}): string {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'

  const bodyLines = body
    ? body
        .split('\n')
        .map((line) =>
          line.trim()
            ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#222;">${escHtml(line)}</p>`
            : '<p style="margin:0 0 16px;">&nbsp;</p>'
        )
        .join('\n')
    : ''

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
            <td style="padding:32px 40px 24px;border-bottom:1px solid #ebebeb;">
              <a href="https://mynameissanderdekker.com" style="text-decoration:none;">
                <span style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999;font-weight:400;">
                  Sander Dekker
                </span>
              </a>
            </td>
          </tr>

          ${imageUrl ? `<!-- Image -->
          <tr>
            <td style="padding:0;">
              <img src="${escAttr(imageUrl)}" alt="${escAttr(heading ?? '')}"
                   width="600" style="width:100%;max-width:600px;display:block;border:0;" />
            </td>
          </tr>` : ''}

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${heading ? `<h1 style="margin:0 0 24px;font-size:26px;font-weight:400;line-height:1.3;color:#111;letter-spacing:-0.3px;">
                ${escHtml(heading)}
              </h1>` : ''}

              <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:#555;">${escHtml(greeting)}</p>

              ${bodyLines}

              ${buttonText && buttonUrl ? `
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;">
                <tr>
                  <td style="background:#111;border-radius:0;">
                    <a href="${escAttr(buttonUrl)}"
                       style="display:inline-block;padding:14px 28px;font-size:13px;letter-spacing:1.5px;
                              text-transform:uppercase;color:#fff;text-decoration:none;font-weight:500;">
                      ${escHtml(buttonText)}
                    </a>
                  </td>
                </tr>
              </table>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #ebebeb;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
                Je ontvangt deze mail omdat je op de lijst van Sander Dekker staat.<br />
                <a href="${escAttr(unsubscribeUrl)}"
                   style="color:#aaa;text-decoration:underline;">Uitschrijven</a>
                &nbsp;·&nbsp;
                <a href="https://mynameissanderdekker.com"
                   style="color:#aaa;text-decoration:underline;">mynameissanderdekker.com</a>
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
