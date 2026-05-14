const nodemailer = require("nodemailer");

const sendEmail = async (options) => {

  console.log("STARTING EMAIL PROCESS");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `DevNotes <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("EMAIL SENT SUCCESSFULLY");
  console.log(info.response);
};

module.exports = sendEmail;