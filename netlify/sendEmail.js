// netlify/functions/sendEmail.js
import nodemailer from 'nodemailer';

export async function handler(event, context) {
  try {
    const { to, subject, text } = JSON.parse(event.body);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // TLS non obligatoire sur port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Imagique" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email envoyé !' })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de l’envoi de l’email', error: error.message })
    };
  }
}
