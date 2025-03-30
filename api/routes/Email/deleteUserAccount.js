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
export async function deleteUserAccount(messageData, ws, Member) {
    try {
        console.log("處理聊天訊息", messageData?.deleteUserAccount);

        // 檢查 messageData.deleteUserAccount 是否存在
        if (!messageData?.deleteUserAccount?.email) {
            ws.send(
                JSON.stringify({
                    deleteUserAccount: {
                        status: "error",
                        message: "Missing email in request",
                    },
                })
            );
            return;
        }

        const email = messageData.deleteUserAccount.email;

        // 尋找現有的會員記錄
        let existingMember = await Member.findOne({ email });

        if (!existingMember) {
            ws.send(
                JSON.stringify({
                    deleteUserAccount: {
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
                deleteUserAccount: {
                    status: "success",
                    message: "OTP sent successfully",
                },
            })
        );
    } catch (error) {
        console.error("[deleteUserAccount] Error:", error);
        ws.send(
            JSON.stringify({
                deleteUserAccount: {
                    status: "error",
                    message: "Internal server error",
                    error: error.message,
                },
            })
        );
    }
}
export async function confirmDeleteUserAccount(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.confirmDeleteUserAccount);
    if (messageData.confirmDeleteUserAccount) {
        try {
            console.log(
                messageData.confirmDeleteUserAccount.emailVerificationCode
            );

            const isValid =
                totp.validate({
                    token: messageData.confirmDeleteUserAccount
                        .emailVerificationCode,
                    window: 1,
                }) !== null;
            if (isValid === true) {
                // 嘗試刪除特定的 Member 項目
                const deleteResult = await Member.deleteOne({
                    email: messageData.confirmDeleteUserAccount.email,
                });

                console.log(deleteResult);

                // 檢查刪除是否成功
                if (deleteResult.deletedCount === 0) {
                    console.log("[Database] 找不到對應的資料，無法刪除");
                    ws.send(
                        JSON.stringify({
                            confirmDeleteUserAccount: {
                                status: "error",
                                message: "找不到對應的資料，無法刪除",
                            },
                        })
                    );
                    return;
                }

                ws.send(
                    JSON.stringify({
                        confirmDeleteUserAccount: {
                            status: "success",
                        },
                    })
                );
            } else {
                ws.send(
                    JSON.stringify({
                        confirmDeleteUserAccount: {
                            status: "fail",
                        },
                    })
                );
            }
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    confirmDeleteUserAccount: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}
