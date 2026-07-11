const BRAND_COLOR = '#a77c5c'
const BRAND_DARK = '#906b4e'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://directory.lawyard.org'
const LOGO_URL = `${SITE_URL}/logo-blue.png`

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function emailLayout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <img src="${LOGO_URL}" alt="Lawyard" width="140" style="display:inline-block;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BRAND_COLOR};padding:28px 36px;">
                    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.3px;">${escapeHtml(title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 36px;font-size:14px;color:#1e293b;line-height:1.6;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 16px 0;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://facebook.com/lawyardNG" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:32px;font-size:14px;text-decoration:none;color:#94a3b8;">f</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://twitter.com/lawyardOrg" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:32px;font-size:14px;text-decoration:none;color:#94a3b8;">𝕏</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://instagram.com/lawyardorg" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:32px;font-size:14px;text-decoration:none;color:#94a3b8;">IG</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://linkedin.com/company/lawyard" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:32px;font-size:14px;text-decoration:none;color:#94a3b8;">in</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">
                Lawyard — Legal news, insights, and directory for Africa.<br/>
                <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">lawyard.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
  return `
<div style="text-align:center;margin:28px 0;">
  <a href="${escapeHtml(url)}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 2px 4px rgba(167,124,92,0.2);">${escapeHtml(label)}</a>
</div>`
}

function footerNote(): string {
  return `<p style="font-size:12px;color:#94a3b8;margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;">Didn't request this? Ignore this email.</p>`
}

// --- Named templates used by the app ---

export function welcomeEmail(params: { name: string; dashboardUrl: string }) {
  return emailLayout('Welcome to Lawyard', `
<p style="font-size:15px;margin:0 0 16px;">Hi <strong>${escapeHtml(params.name)}</strong>,</p>
<p style="color:#475569;margin:0 0 20px;">Your Lawyard account is ready. You can now browse the directory, manage your profile, and connect with legal professionals.</p>
${ctaButton(params.dashboardUrl, 'Go to Dashboard')}
<p style="color:#475569;margin:0 0 8px;font-weight:600;">From your dashboard, you can:</p>
<ul style="color:#475569;line-height:1.8;padding-left:20px;margin:0 0 24px;">
  <li>Browse and search legal professionals in our directory</li>
  <li>Manage your professional profile and listings</li>
  <li>Post legal needs and connect with expert counsel</li>
  <li>Track inquiries and messages</li>
</ul>
${footerNote()}`)
}

export function magicLinkEmail(confirmationUrl: string) {
  return emailLayout('Sign in to Lawyard', `
<p style="font-size:15px;margin:0 0 8px;">Hi there,</p>
<p style="color:#475569;margin:0 0 24px;">Click the button below to sign in to your Lawyard account. This link expires in 1 hour.</p>
${ctaButton(confirmationUrl, 'Sign In')}
${footerNote()}`)
}

export function confirmationEmail(confirmationUrl: string) {
  return emailLayout('Confirm your account', `
<p style="font-size:15px;margin:0 0 8px;">Hi there,</p>
<p style="color:#475569;margin:0 0 24px;">Click the button below to confirm your Lawyard account and get started.</p>
${ctaButton(confirmationUrl, 'Confirm Account')}
${footerNote()}`)
}

export function recoveryEmail(confirmationUrl: string) {
  return emailLayout('Reset your password', `
<p style="font-size:15px;margin:0 0 8px;">Hi there,</p>
<p style="color:#475569;margin:0 0 24px;">Click the button below to reset your Lawyard password. This link expires in 1 hour.</p>
${ctaButton(confirmationUrl, 'Reset Password')}
${footerNote()}`)
}

export function corporatePostReceived(params: { brandName: string; tier: string }) {
  return emailLayout('Submission Received', `
<p>Your Corporate Post for <strong>${escapeHtml(params.brandName)}</strong> (${escapeHtml(params.tier)} tier) has been received.</p>
<p>Once payment is confirmed, we will review your submission.</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">— Lawyard Team</p>
${footerNote()}`)
}

export function paymentConfirmation(params: { brandName: string; tier: string }) {
  return emailLayout('Payment Confirmed', `
<p>Payment for your <strong>${escapeHtml(params.tier)}</strong> Corporate Post on <strong>${escapeHtml(params.brandName)}</strong> has been confirmed.</p>
<p>Your submission is now under review. We will notify you once it's published.</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">— Lawyard Team</p>
${footerNote()}`)
}

export function corporatePostApproved(params: { brandName: string }) {
  return emailLayout('Published!', `
<p>Your Corporate Post on <strong>${escapeHtml(params.brandName)}</strong> has been published on lawyard.org.</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">— Lawyard Team</p>
${footerNote()}`)
}

export function corporatePostRejected(params: { brandName: string }) {
  return emailLayout('Submission Update', `
<p>Your Corporate Post submission for <strong>${escapeHtml(params.brandName)}</strong> requires revisions.</p>
<p>Please contact us at <a href="mailto:contact@lawyard.org" style="color:${BRAND_COLOR};font-weight:600;">contact@lawyard.org</a> for more details.</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">— Lawyard Team</p>
${footerNote()}`)
}

export function inquiryNotification(params: {
  lawyerName: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  message: string
}) {
  const phoneRow = params.clientPhone
    ? `<tr><td style="padding:6px 0;color:#64748B;width:100px;">Phone</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(params.clientPhone)}</td></tr>`
    : ''
  return emailLayout('New Consultation Request', `
<p>Hi <strong>${escapeHtml(params.lawyerName)}</strong>,</p>
<p>Someone has requested a consultation through your Lawyard profile.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
  <tr><td style="padding:6px 0;color:#64748B;width:100px;">Name</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(params.clientName)}</td></tr>
  <tr><td style="padding:6px 0;color:#64748B;">Email</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(params.clientEmail)}</td></tr>
  ${phoneRow}
</table>
<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;font-size:13px;">
  <p style="margin:0 0 8px;font-weight:600;font-size:13px;">Message</p>
  <p style="margin:0;color:#475569;line-height:1.6;">${escapeHtml(params.message)}</p>
</div>
<p style="color:#94a3b8;font-size:12px;margin-top:24px;">
  Respond to the client directly at <a href="mailto:${escapeHtml(params.clientEmail)}" style="color:${BRAND_COLOR};font-weight:600;">${escapeHtml(params.clientEmail)}</a>
</p>
${footerNote()}`)
}

export function corporatePostInvoice(params: {
  brandName: string
  contactName: string
  tierName: string
  amount: number
  reference: string
}) {
  const issuedDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const fmtAmount = `₦${params.amount.toLocaleString()}`
  return emailLayout('INVOICE', `
<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <tr><td style="padding:6px 0;color:#64748B;width:100px;">Issued</td><td style="padding:6px 0;font-weight:600;">${issuedDate}</td></tr>
  <tr><td style="padding:6px 0;color:#64748B;">Bill To</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(params.contactName)} (${escapeHtml(params.brandName)})</td></tr>
</table>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <thead>
    <tr style="border-bottom:1px solid #e2e8f0;">
      <th style="text-align:left;padding:10px 0;color:#64748B;font-weight:600;font-size:12px;text-transform:uppercase;">Description</th>
      <th style="text-align:right;padding:10px 0;color:#64748B;font-weight:600;font-size:12px;text-transform:uppercase;">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:12px 0;">Corporate Post — ${escapeHtml(params.tierName)} Tier</td><td style="padding:12px 0;text-align:right;font-weight:600;">${fmtAmount}</td></tr>
  </tbody>
</table>
<hr style="border:none;border-top:2px solid #1e293b;margin:12px 0;" />
<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding:8px 0;">
  <span>Total Due</span><span>${fmtAmount}</span>
</div>
<div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:24px;font-size:13px;color:#475569;">
  <p style="margin:0 0 8px;font-weight:600;">Payment Instructions</p>
  <p style="margin:0 0 4px;">Bank transfer to:</p>
  <p style="margin:0;font-family:monospace;font-weight:600;">Lawyard Publishing Ltd<br/>GTBank · 0123456789</p>
  <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Use reference <strong>${escapeHtml(params.reference)}</strong> as payment narration.</p>
</div>
${footerNote()}`)
}

export function shopOrderConfirmation(params: {
  firstName?: string
  reference: string
  amount: number
  items: { title: string; quantity: number }[]
}) {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const fmtAmount = `₦${params.amount.toLocaleString()}`
  const itemsHtml = params.items.map(item =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;">${escapeHtml(item.title)}</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center;">${item.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;">₦${(item.quantity * 500).toLocaleString()}</td></tr>`
  ).join('')

  return emailLayout('Order Confirmed', `
<p>${params.firstName ? `Hi ${escapeHtml(params.firstName)},` : 'Thanks for your purchase!'}</p>
<p style="color:#475569;font-size:13px;">Your payment of <strong>${fmtAmount}</strong> was successful. Here's a summary of your order:</p>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
  <thead>
    <tr style="background:#f8fafc;">
      <th style="text-align:left;padding:10px;font-weight:600;font-size:11px;text-transform:uppercase;color:#64748B;">Item</th>
      <th style="text-align:center;padding:10px;font-weight:600;font-size:11px;text-transform:uppercase;color:#64748B;">Qty</th>
      <th style="text-align:right;padding:10px;font-weight:600;font-size:11px;text-transform:uppercase;color:#64748B;">Amount</th>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
</table>
<div style="text-align:right;font-size:16px;font-weight:800;padding:12px 0 0;margin-top:8px;border-top:2px solid #1e293b;">Total: ${fmtAmount}</div>
<div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:24px;font-size:13px;color:#475569;">
  <p style="margin:0 0 8px;font-weight:600;">Download Your Legislations</p>
  <p style="margin:0;">Visit your <a href="https://lawyard.org/dashboard/orders" style="color:${BRAND_COLOR};font-weight:600;">Orders Dashboard</a> to download the PDF files for each purchased legislation.</p>
</div>
${footerNote()}`)
}

export function adminNewSubmission(params: { brandName: string; title: string }) {
  return emailLayout('New Submission', `
<p><strong>Brand:</strong> ${escapeHtml(params.brandName)}</p>
<p><strong>Title:</strong> ${escapeHtml(params.title)}</p>
<p>Review it in the <a href="https://lawyard.org/admin/corporate-posts" style="color:${BRAND_COLOR};font-weight:600;">admin dashboard</a>.</p>
${footerNote()}`)
}

// Generate inline HTML for Supabase Auth templates (no template variables except {{ .ConfirmationURL }})
function authLayout(title: string, bodyHtml: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <div style="text-align:center;padding:24px 36px 0;">
    <img src="https://directory.lawyard.org/logo-blue.png" alt="Lawyard" width="140" style="display:inline-block;border:0;" />
  </div>
  <div style="background:#a77c5c;margin:16px 36px 0;padding:20px 24px;border-radius:8px;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">${title}</h1>
  </div>
  <div style="padding:24px 36px 32px;font-size:14px;color:#1e293b;line-height:1.6;">
    ${bodyHtml}
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;">Didn't request this? Ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
      <tr>
        <td style="padding:0 6px;"><a href="https://facebook.com/lawyardNG" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:28px;font-size:12px;text-decoration:none;color:#94a3b8;">f</a></td>
        <td style="padding:0 6px;"><a href="https://twitter.com/lawyardOrg" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:28px;font-size:12px;text-decoration:none;color:#94a3b8;">𝕏</a></td>
        <td style="padding:0 6px;"><a href="https://instagram.com/lawyardorg" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:28px;font-size:12px;text-decoration:none;color:#94a3b8;">IG</a></td>
        <td style="padding:0 6px;"><a href="https://linkedin.com/company/lawyard" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#e2e8f0;text-align:center;line-height:28px;font-size:12px;text-decoration:none;color:#94a3b8;">in</a></td>
      </tr>
    </table>
    <p style="font-size:11px;color:#94a3b8;margin:0;">Lawyard &mdash; Legal news, insights, and directory for Africa.<br/><a href="https://lawyard.org" style="color:#a77c5c;text-decoration:none;font-weight:600;">lawyard.org</a></p>
  </div>
</div>`
}

export function authMagicLinkTemplate(): string {
  return authLayout('Sign in to Lawyard', `
<p style="font-size:15px;margin:0 0 16px;">Hi there,</p>
<p style="color:#475569;margin:0 0 24px;">Click the button below to sign in to your Lawyard account. This link expires in 1 hour.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#a77c5c;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 2px 4px rgba(167,124,92,0.2);">Sign In</a>
</div>`)
}

export function authConfirmationTemplate(): string {
  return authLayout('Confirm your account', `
<p style="font-size:15px;margin:0 0 16px;">Hi there,</p>
<p style="color:#475569;margin:0 0 24px;">Click the button below to confirm your Lawyard account and get started.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#a77c5c;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 2px 4px rgba(167,124,92,0.2);">Confirm Account</a>
</div>`)
}

export function authRecoveryTemplate(): string {
  return authLayout('Reset your password', `
<p style="font-size:15px;margin:0 0 16px;">Hi there,</p>
<p style="color:#475569;margin:0 0 24px;">Click the button below to reset your Lawyard password. This link expires in 1 hour.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#a77c5c;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 2px 4px rgba(167,124,92,0.2);">Reset Password</a>
</div>`)
}
