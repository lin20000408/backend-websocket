import contactFormSend from "../../../helpers/email-helpers.js";
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
export async function forgetUserPassword(messageData, ws, Member) {
    try {
        console.log("處理聊天訊息", messageData?.forgetUserPassword);

        // 檢查 messageData.forgetUserPassword 是否存在
        if (!messageData?.forgetUserPassword?.email) {
            ws.send(
                JSON.stringify({
                    forgetUserPassword: {
                        status: "error",
                        message: "Missing email in request",
                    },
                })
            );
            return;
        }

        const email = messageData.forgetUserPassword.email;

        // 尋找現有的會員記錄
        let existingMember = await Member.findOne({ email });

        if (!existingMember) {
            ws.send(
                JSON.stringify({
                    forgetUserPassword: {
                        status: "fail",
                        message: "invalidUserEmail",
                    },
                })
            );
            return;
        }

        // 產生 OTP
        const otp = totp.generate();
        console.log(`Generated OTP for ${email}:`, otp);

        const subject = "OTP Verification";
        const message = `您的 OTP 驗證碼是：${otp}`;

        // 發送 OTP 郵件
        await contactFormSend(email, subject, message);

        ws.send(
            JSON.stringify({
                forgetUserPassword: {
                    status: "success",
                    message: "OTP sent successfully",
                },
            })
        );
    } catch (error) {
        console.error("[forgetUserPassword] Error:", error);
        ws.send(
            JSON.stringify({
                forgetUserPassword: {
                    status: "error",
                    message: "Internal server error",
                    error: error.message,
                },
            })
        );
    }
}
export async function confirmForgetUserPasswordCode(messageData, ws) {
    console.log("處理聊天訊息", messageData.confirmForgetUserPasswordCode);
    if (messageData.confirmForgetUserPasswordCode) {
        try {
            console.log(
                messageData.confirmForgetUserPasswordCode.emailVerificationCode
            );

            const isValid =
                totp.validate({
                    token: messageData.confirmForgetUserPasswordCode
                        .emailVerificationCode,
                    window: 1,
                }) !== null;
            if (isValid === true) {
                ws.send(
                    JSON.stringify({
                        confirmForgetUserPasswordCode: {
                            status: "success",
                        },
                    })
                );
            } else {
                ws.send(
                    JSON.stringify({
                        confirmForgetUserPasswordCode: {
                            status: "fail",
                        },
                    })
                );
            }
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    confirmForgetUserPasswordCode: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}
export async function confirmUpdateUserPassword(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.confirmUpdateUserPassword);
    if (messageData.confirmUpdateUserPassword) {
        try {
            console.log(
                messageData.confirmUpdateUserPassword.emailVerificationCode
            );

            const isValid =
                totp.validate({
                    token: messageData.confirmUpdateUserPassword
                        .emailVerificationCode,
                    window: 1,
                }) !== null;
            if (isValid === true) {
                // 首先嘗試更新特定的 data 項目
                const updateResult = await Member.updateOne(
                    {
                        email: messageData.confirmUpdateUserPassword.email,
                    },
                    {
                        $set: {
                            password:
                                messageData.confirmUpdateUserPassword.newPassword,
                        },
                    }
                );
                console.log(updateResult);

                // 檢查更新是否成功
                if (updateResult.modifiedCount === 0) {
                    console.log("[Database] 找不到對應的資料，無法更新");
                    ws.send(
                        JSON.stringify({
                            confirmUpdateUserPassword: {
                                status: "error",
                                message: "找不到對應的資料或無需更新",
                            },
                        })
                    );
                    return;
                }

                ws.send(
                    JSON.stringify({
                        confirmUpdateUserPassword: {
                            status: "success",
                        },
                    })
                );
            } else {
                ws.send(
                    JSON.stringify({
                        confirmUpdateUserPassword: {
                            status: "fail",
                        },
                    })
                );
            }
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    confirmUpdateUserPassword: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}
