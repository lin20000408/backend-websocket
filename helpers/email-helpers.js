import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const contactFormSend = async ( email, subject, message) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD
      }
    })
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject,
      html: `<br/><br/><h3>Message:</h3><br/><p>${message}</p>`
    }
    const sendMail = await transporter.sendMail(mailOptions)
    return sendMail
  }
  
  export default contactFormSend;
  