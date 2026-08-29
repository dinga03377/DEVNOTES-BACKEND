const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    console.log("STARTING EMAIL PROCESS");
    console.log("EMAIL USER:", process.env.EMAIL_USER);

    const { data, error } = await resend.emails.send({
      from: "DevNotes <onboarding@resend.dev>",
      to: [options.email],
      subject: options.subject,
      html: options.message,
    });

    if (error) {
      console.log("RESEND EMAIL ERROR:");
      console.log(error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("EMAIL SENT SUCCESSFULLY");
    console.log("RESEND EMAIL ID:", data?.id);

    return data;
  } catch (error) {
    console.log("EMAIL ERROR:");
    console.log(error);

    throw error;
  }
};

module.exports = sendEmail;