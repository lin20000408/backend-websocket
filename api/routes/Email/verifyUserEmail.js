import contactFormSend from "./../../../helpers/email-helpers.js";
import * as OTPAuth from "otpauth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import NodeCache from 'node-cache'; // 引入 node-cache

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
// 定義常數
const OTP_COOLDOWN_SECONDS = 600; // 10 分鐘
const STATUS_SUCCESS = 'success';
const STATUS_ERROR = 'error';

// 創建一個快取實例
// stdTTL: 0 表示預設情況下快取永不過期，我們將在 set 時單獨指定 TTL
// checkperiod: 定期檢查過期項目的間隔（秒）
const otpRequestCache = new NodeCache({ stdTTL: 0, checkperiod: 120 });


export async function verifyUserEmail(messageData, ws, Member) {
    try {
        console.log('處理聊天訊息', messageData?.verifyUserEmail);

        // 1. 檢查 email
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

        // --- (可選) 檢查用戶是否存在於資料庫 ---
        // 即使不用資料庫存時間戳，您可能仍需確認 email 對應用戶存在
         const memberExists = await Member.exists({ email });
         if (memberExists) {
             ws.send(
                 JSON.stringify({
                     verifyUserEmail: { status: STATUS_ERROR, message: '已經有' },
                 })
             );
             return;
         }
        // --- (可選) 檢查結束 ---


        // 2. 檢查記憶體快取中是否有該 email 的冷卻記錄
        const ttlTimestamp = otpRequestCache.getTtl(email); // 獲取 key 的過期時間戳(ms)

        if (ttlTimestamp) {
             // 如果 ttlTimestamp 存在且大於當前時間，表示仍在冷卻期
            const currentTime = Date.now();
            if (ttlTimestamp > currentTime) {
                const remainingMilliseconds = ttlTimestamp - currentTime;
                const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);

                console.log(`用戶 ${email} 在冷卻時間內請求 OTP。剩餘：${remainingSeconds} 秒`);
                ws.send(
                    JSON.stringify({
                        verifyUserEmail: {
                            status: "success",
                            message: `請求過於頻繁，請稍後再試。請在 ${remainingSeconds} 秒後重試。`,
                            expiresAt: remainingSeconds,
                        },
                    })
                );
                return; // 阻止後續操作
            }
        }

        // 3. 如果不在冷卻期內 (快取中無記錄或已過期)
        // 產生新的 OTP
        const otp = totp.generate();
        console.log(`為 ${email} 產生 OTP:`, otp);
        const subject = 'OTP 驗證';
        const message = `您的 OTP 驗證碼是：${otp}`;

        // 發送 OTP 郵件
        await contactFormSend(email, subject, message);

        // 將請求記錄存入快取，設定 TTL 為冷卻時間
        // 這裡我們存入當前時間戳，但其實存入任何值(例如 true)都可以，關鍵是 TTL
        otpRequestCache.set(email, Date.now(), OTP_COOLDOWN_SECONDS);

        // 回傳成功訊息
        ws.send(
            JSON.stringify({
                verifyUserEmail: {
                    status: STATUS_SUCCESS,
                    message: 'OTP 已成功發送',
                    expiresAt: OTP_COOLDOWN_SECONDS,
                },
            })
        );

    } catch (error) {
        console.error('[VerifyUserEmail with Cache] 發生錯誤:', error);
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
                // 檢查更新是否成功
                if (updateResult.modifiedCount === 0) {
                    return;
                }
            }
            // 再判斷是否有.avatar 更新，並獨立執行

            if (updateUserProfile.avatar) {
                // 配置 S3 客戶端
                const s3Client = new S3Client({
                    region: process.env.AWS_REGION || "us-east-1",
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "123",
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "123",
                    },
                });
            
                async function uploadBase64ToS3(base64String, bucketName) {
                    try {
                        if (!base64String || !bucketName) {
                            throw new Error("缺少必要的參數");
                        }
            
                        const base64Pattern = /^data:image\/\w+;base64,/;
                        if (!base64Pattern.test(base64String)) {
                            throw new Error("無效的 base64 圖片格式");
                        }
            
                        const base64Data = base64String.replace(base64Pattern, "");
                        const buffer = Buffer.from(base64Data, "base64");
                        const fileName = `${uuidv4()}.jpg`;
            
                        const command = new PutObjectCommand({
                            Bucket: bucketName,
                            Key: fileName,
                            Body: buffer,
                            ContentType: "image/jpeg",
                            // 移除 ACL 參數，讓 bucket policy 控制存取權限
                        });
            
                        await s3Client.send(command);
            
                        // 構建公開 URL https://powrplusbucket.s3.ap-northeast-1.amazonaws.com/userID-ivy@gmail.com/avatar/e99de8ba-b220-4f2f-b4b1-c6f427ba9d7e
                        const url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
            
                        return {
                            success: true,
                            url: url,
                            key: fileName,
                        };
                    } catch (error) {
                        console.error("S3 上傳失敗:", error);
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
            
                async function updateUserAvatar() {
                    try {
                        const base64String = updateUserProfile.avatar;
                        const bucketName = process.env.S3_BUCKET_NAME || "123";
            
                        const uploadResult = await uploadBase64ToS3(base64String, bucketName);
            
                        if (!uploadResult.success) {
                            throw new Error(`圖片上傳失敗: ${uploadResult.error}`);
                        }
            console.log(uploadResult.url);
            
                        const updateResult = await Member.updateOne(
                            {
                                sauser_accessToken: updateUserProfile.sauser_accessToken,
                            },
                            {
                                $set: {
                                    "data.avatar": uploadResult.url
                                },
                               
                            }
                        );
            
                        if (updateResult.modifiedCount === 0) {
                            console.warn("未找到匹配的用戶或頭像未更新");
                            return { success: false, message: "未找到匹配的用戶" };
                        }
            
                        console.log("更新結果:", updateResult);
                        console.log("圖片 URL:", updateUserProfile.sauser_accessToken);
                        return { 
                            success: true, 
                            url: uploadResult.url,
                            key: uploadResult.key 
                        };
            
                    } catch (error) {
                        console.error("更新用戶頭像失敗:", error);
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
            
                // 執行並處理結果
                updateUserAvatar()
                    .then(result => {
                        if (!result.success) {
                            console.error("操作失敗:", result.error);
                        }
                    })
                    .catch(error => {
                        console.error("未預期的錯誤:", error);
                    });
            }
            // 遍歷 updateUserProfile 物件，僅加入有值的欄位
            Object.keys(updateUserProfile).forEach((key) => {
                const value = updateUserProfile[key];
                if (
                    key !== "emailVerificationCode" &&
                    key !== "sauser_accessToken" &&
                    key !== "email" &&
                    key !== "avatar" &&
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
