export interface DailyVerseEmailProps {
  chapter: number;
  verse: number;
  translation: string;
  commentary: string;
  unsubscribeUrl: string;
}

export function generateDailyVerseEmail({
  chapter,
  verse,
  translation,
  commentary,
  unsubscribeUrl,
}: DailyVerseEmailProps): { subject: string; html: string; text: string } {
  const subject = `Daily Verse: Bhagavad Gita ${chapter}:${verse}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Verse</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f5f0; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" style="width: 100%; max-width: 580px; margin: 0 auto; padding: 32px 24px;">
    <tr>
      <td>
        <p style="color: #5c4d3d; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Good morning,
        </p>

        <p style="color: #5c4d3d; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
          Here is today's verse from the Bhagavad Gita — Chapter ${chapter}, Verse ${verse}:
        </p>

        <blockquote style="margin: 0 0 28px 0; padding: 20px 24px; background-color: #fff; border-left: 3px solid #c9a87c; border-radius: 2px;">
          <p style="color: #3d3229; font-size: 18px; line-height: 1.7; margin: 0; font-style: italic;">
            "${translation}"
          </p>
        </blockquote>

        <p style="color: #5c4d3d; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
          ${commentary}
        </p>

        <p style="margin: 0 0 40px 0;">
          <a href="https://gitachat.org/verse/${chapter}/${verse}"
             style="color: #8b6f4a; text-decoration: underline; font-size: 15px;">
            Read more on GitaChat →
          </a>
        </p>

        <p style="color: #5c4d3d; font-size: 16px; margin: 0;">
          Wishing you a peaceful day,<br>
          <span style="color: #8b6f4a;">GitaChat</span>
        </p>

        <hr style="border: none; height: 1px; background-color: #e0d8ce; margin: 36px 0 20px 0;">
        <p style="color: #9a8d7f; font-size: 13px; line-height: 1.6; margin: 0;">
          You're receiving this because you subscribed to daily verses.
          <a href="${unsubscribeUrl}" style="color: #9a8d7f; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `Daily Verse - Bhagavad Gita ${chapter}:${verse}

${translation}

---

Commentary:
${commentary}

---

Read on GitaChat: https://gitachat.org/verse/${chapter}/${verse}

Unsubscribe: ${unsubscribeUrl}
`;

  return { subject, html, text };
}
