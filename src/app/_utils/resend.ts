import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBook(title: string, uploadthingUrl: string, kindleEmail: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Alexs Archive <kindle@alexs-archive.org>',
      to: [kindleEmail],
      subject: title,
      html: '<p>' + title + ' has been sent to your Kindle!</p>',
      attachments: [
        {
          path: uploadthingUrl,
          filename: title + '.epub',
        },
      ],
    });

    if (error) {
      throw new Error('Failed to send ePub');
    }

    return data;
  } catch (error) {
    console.error('Error sending ePub:', error);
    return null;
  }
}