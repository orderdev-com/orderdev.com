import { resend } from "./resend";
import { isProd } from "../utils/isProd";


export const sendUserOtpEmail = async (
    email: string,
    code: string
) => {
    const from = "no-reply-otp <no-reply-otp@orderdev.com>";
    const to = email;
    const subject = `One-Time-Password: ${code}`;
    const html = `Please use the code below to access your user
----------------
Code: ${code}
----------------
This code will expire in 10 minutes.`;

    if (isProd) {
        // const send = await
        resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        // return send.data;
        return 200;
    } else {
        console.log(`from: ${from}`);
        console.log(`to: ${to}`);
        console.log(`subject: ${subject}`);
        console.log(`html: ${html}`);
        return 200;
    }

};