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
export async function verifyUserEmail(messageData, ws, Member) {
    try {
        console.log("處理聊天訊息", messageData?.verifyUserEmail);

        // 檢查 messageData.verifyUserEmail 是否存在
        if (!messageData?.verifyUserEmail?.email) {
            ws.send(
                JSON.stringify({
                    verifyUserEmail: {
                        status: "error",
                        message: "Missing email in request",
                    },
                })
            );
            return;
        }

        const email = messageData.verifyUserEmail.email;

        // 尋找現有的會員記錄
        let existingMember = await Member.findOne({ email });

        if (existingMember) {
            ws.send(
                JSON.stringify({
                    verifyUserEmail: {
                        status: "error",
                        message: "User already exists",
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
                verifyUserEmail: {
                    status: "success",
                    message: "OTP sent successfully",
                },
            })
        );
    } catch (error) {
        console.error("[VerifyUserEmail] Error:", error);
        ws.send(
            JSON.stringify({
                verifyUserEmail: {
                    status: "error",
                    message: "Internal server error",
                    error: error.message,
                },
            })
        );
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
            } else {
                ws.send(
                    JSON.stringify({
                        confirmUserEmail: {
                            status: "fail",
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
export async function userRegister(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.userRegister);

    if (!messageData.userRegister) {
        ws.send(
            JSON.stringify({
                userRegister: {
                    status: "error",
                    message: "缺少註冊資料",
                },
            })
        );
        return;
    }

    const { userRegister } = messageData;
    // const hasEmailVerification = !!userRegister.emailVerificationCode;

    try {
        // 如果有驗證碼，檢查其有效性
        // let isValid = true; // 預設為 true，若無驗證碼則不檢查
        // if (userRegister.emailVerificationCode) {
        //     isValid =
        //         totp.validate({
        //             token: userRegister.emailVerificationCode,
        //             window: 1,
        //         }) !== null;

        //     if (!isValid) {
        //         ws.send(
        //             JSON.stringify({
        //                 userRegister: {
        //                     status: "error",
        //                     message: "驗證碼無效",
        //                 },
        //             })
        //         );
        //         return;
        //     }
        // }
        // Define the random string generator
        function generateRandomString() {
            const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            return Array(16)
                .fill()
                .map(() =>
                    characters.charAt(
                        Math.floor(Math.random() * characters.length)
                    )
                )
                .join("");
        }

        // Generate the access token once and reuse it
        const accessToken = generateRandomString();
        console.log("Generated access token:", accessToken);

        // 建立新會員資料
        const newMemberData = new Member({
            userID: userRegister.userID,
            password: userRegister.password,

            data: {
                firstName: userRegister.firstName,
                lastName: userRegister.lastName,
                birthday: userRegister.birthday,
                gender: userRegister.gender,
                units: userRegister.units,
                cm: userRegister.cm || null,
                inch: userRegister.inch || null,
                kg: userRegister.kg || null,
                lb: userRegister.lb || null,
            },
        });
        // 只有在 email 驗證過後才加入 email 欄位
        if (userRegister.emailVerificationCode) {
            newMemberData.email = userRegister.email;
        }

        // 只有在 googleSub 存在時才加入 googlesub 和 sauser_accessToken
        if (userRegister.googleSub) {
            newMemberData.googlesub = userRegister.googleSub;
            newMemberData.sauser_accessToken = generateRandomString();
        }
        // 建立新的會員物件
        const newMember = new Member(newMemberData);

        // 儲存到 MongoDB
        await newMember.save();
        // 儲存到 MongoDB
        await newMember.save();
        console.log("會員已儲存到 MongoDB");

        // 回傳成功訊息
        ws.send(
            JSON.stringify({
                userRegister: {
                    status: "success",
                },
            })
        );
    } catch (err) {
        console.error("儲存會員失敗:", err);
        ws.send(
            JSON.stringify({
                userRegister: {
                    status: "error",
                    message: err.message || "註冊失敗",
                },
            })
        );
    }
}

export async function updateUserProfile(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.updateUserProfile);
    if (messageData.updateUserProfile) {
        try {
            const updateData = {};
            const { updateUserProfile } = messageData;
            // 先判斷是否有 email 更新，並獨立執行
            if (updateUserProfile.email) {
                const updateResult = await Member.updateOne(
                    {
                        sauser_accessToken:
                            updateUserProfile.sauser_accessToken,
                    },
                    {
                        $set: {
                            email: updateUserProfile.email,
                        },
                    }
                );
                console.log(updateResult);
            }

            // 遍歷 updateUserProfile 物件，僅加入有值的欄位
            Object.keys(updateUserProfile).forEach((key) => {
                const value = updateUserProfile[key];
                if (
                    key !== "emailVerificationCode" &&
                    key !== "sauser_accessToken" &&
                    key !== "email" &&
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    updateData[`data.${key}`] = value;
                }
            });

            // 確保有要更新的資料才執行 updateOne
            if (Object.keys(updateData).length > 0) {
                const updateResult = await Member.updateOne(
                    {
                        sauser_accessToken:
                            updateUserProfile.sauser_accessToken,
                    },
                    { $set: updateData }
                );

                console.log(updateResult);
            }
            ws.send(
                JSON.stringify({
                    updateUserProfile: {
                        status: "success",
                    },
                })
            );
        } catch (error) {
            console.error("更新用戶資料時發生錯誤:", error);
            ws.send(
                JSON.stringify({
                    updateUserProfile: {
                        status: "error",
                        message: error.message,
                    },
                })
            );
        }
    }
}
