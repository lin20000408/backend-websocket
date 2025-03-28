import contactFormSend from "./../../../helpers/email-helpers.js";
import * as OTPAuth from "otpauth";
// 產生一組新的 OTP 密鑰
const secret = new OTPAuth.Secret({ size: 20 }); // 產生一個隨機密鑰
const totp = new OTPAuth.TOTP({
    issuer: "MyApp",
    label: "user@example.com",
    algorithm: "SHA1",
    digits: 6,
    period: 300, // OTP 30 秒內有效
    secret: secret,
});
export async function verifyUserEmail(messageData, ws) {
    console.log("處理聊天訊息", messageData.verifyUserEmail);
    if (messageData.verifyUserEmail) {
        try {
            const otp = totp.generate(); // 產生 OTP
            console.log(otp);
            
            const email = messageData.verifyUserEmail.email;
            const subject = "otp verify";
            const message = `您的 OTP 驗證碼是：${otp}`;
            await contactFormSend(email, subject, message); // Added await for async operation

            ws.send(
                JSON.stringify({
                    verifyUserEmail: {
                        status: "success",
                    },
                })
            );
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    verifyUserEmail: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}
export async function confirmUserEmail(messageData, ws) {
    console.log("處理聊天訊息", messageData.confirmUserEmail);
    if (messageData.confirmUserEmail) {
        try {
            console.log(messageData.confirmUserEmail.emailVerificationCode);
            
            const isValid =
                totp.validate({
                    token: messageData.confirmUserEmail.emailVerificationCode,
                    window: 1,
                }) !== null;
            if (isValid === true) {
                ws.send(
                    JSON.stringify({
                        confirmUserEmail: {
                            status: "success",
                        },
                    })
                );
            }
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    confirmUserEmail: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}
