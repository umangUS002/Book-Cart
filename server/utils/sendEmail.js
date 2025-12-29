// utils/sendEmail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password
  },
});

export const sendNewBookEmail = async (emails, book) => {
  await transporter.sendMail({
    from: `"Book Cart 📚" <${process.env.EMAIL_USER}>`,
    to: emails,
    subject: `📚 New Book Added: ${book.title}`,
    html: newBookEmailTemplate(book),
  });
};
