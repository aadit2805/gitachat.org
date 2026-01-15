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
<body style="margin: 0; padding: 0; background-color: #1a1410; font-family: Georgia, serif;">
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <h1 style="color: #e8c9a0; font-size: 28px; font-weight: 400; margin-bottom: 8px;">
          Daily Verse
        </h1>
        <p style="color: #e8a54c; font-size: 14px; letter-spacing: 0.1em; margin-bottom: 32px;">
          CHAPTER ${chapter}, VERSE ${verse}
        </p>

        <blockquote style="margin: 0 0 32px 0; padding-left: 20px; border-left: 2px solid #e8a54c;">
          <p style="color: #e8c9a0; font-size: 20px; line-height: 1.6; margin: 0;">
            ${translation}
          </p>
        </blockquote>

        <hr style="border: none; height: 1px; background-color: #3d2f24; margin: 24px 0;">

        <h2 style="color: #e8a54c; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px;">
          Commentary
        </h2>
        <p style="color: #a89080; font-size: 16px; line-height: 1.8;">
          ${commentary}
        </p>

        <p style="margin-top: 32px;">
          <a href="https://gitachat.org/verse/${chapter}/${verse}"
             style="color: #e8a54c; text-decoration: none; font-size: 14px;">
            Read on GitaChat
          </a>
        </p>

        <hr style="border: none; height: 1px; background-color: #3d2f24; margin: 40px 0 24px 0;">
        <p style="color: #6d5f52; font-size: 12px; margin: 0;">
          You received this email because you subscribed to daily verses from GitaChat.
          <br><br>
          <a href="${unsubscribeUrl}" style="color: #6d5f52; text-decoration: underline;">
            Unsubscribe
          </a>
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
