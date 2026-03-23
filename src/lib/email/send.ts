import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ContentTweakr <notifications@contenttweakr.com>';

interface Opportunity {
  title: string;
  subreddit: string;
  url: string;
  confidence: number;
  context: string;
}

export async function sendOpportunityNotification(
  toEmail: string,
  opportunities: Opportunity[],
  scanId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email notification');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const top3 = opportunities.slice(0, 3);

  const opportunityRows = top3
    .map(
      (opp) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px;">
            r/${opp.subreddit}
          </span>
          <span style="display: inline-block; background: ${opp.confidence >= 80 ? '#dcfce7' : '#fef9c3'}; color: ${opp.confidence >= 80 ? '#166534' : '#854d0e'}; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; margin-left: 6px;">
            ${opp.confidence}% match
          </span>
        </div>
        <a href="${opp.url}" style="color: #1e293b; font-weight: 600; text-decoration: none; font-size: 15px;">
          ${escapeHtml(opp.title)}
        </a>
        ${opp.context ? `<p style="color: #64748b; font-size: 13px; margin: 8px 0 0; line-height: 1.4;">${escapeHtml(opp.context.substring(0, 150))}${opp.context.length > 150 ? '...' : ''}</p>` : ''}
      </td>
    </tr>`,
    )
    .join('');

  const remainingCount = opportunities.length - top3.length;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 20px; color: #0f172a; margin: 0;">ContentTweakr</h1>
      <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">New high-confidence opportunities found</p>
    </div>

    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
      <div style="padding: 16px 16px 12px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #475569; font-size: 14px;">
          <strong>${opportunities.length}</strong> opportunit${opportunities.length === 1 ? 'y' : 'ies'} found in your latest scan
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${opportunityRows}
      </table>

      ${remainingCount > 0 ? `
      <div style="padding: 12px 16px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 13px;">
          + ${remainingCount} more opportunit${remainingCount === 1 ? 'y' : 'ies'}
        </p>
      </div>` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        You're receiving this because email notifications are enabled in your settings.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${opportunities.length} new opportunit${opportunities.length === 1 ? 'y' : 'ies'} found — ContentTweakr`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send error:', message);
    return { success: false, error: message };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
