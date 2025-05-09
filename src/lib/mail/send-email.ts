import { transporter } from "./transporter";

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  await transporter.sendMail({
    from: '"spendee" <no-reply@spendee.com>',
    to,
    subject,
    html,
  });
};
