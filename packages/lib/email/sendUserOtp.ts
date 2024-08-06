import { resend } from "./resend";


export const sendUserOtp = async (
    email: string,
    code: string
) => {
    const from = "no-reply-otp <no-reply-otp@orderdev.com>";
    const to = email;
    const subject = `One-Time-Password: ${code}`;
    const html = `Please use the code below to access your user
----------------
Code: ${code}
----------------`;

    if (process.env.NODE_ENV === "production") {
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