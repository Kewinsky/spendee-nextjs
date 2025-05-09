import { APP_NAME } from "../constanst";
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
    from: `"${APP_NAME}" <no-reply@${APP_NAME}.com>`,
    to,
    subject,
    html,
  });
};
