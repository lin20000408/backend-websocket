import contactFormSend from "./../../../helpers/email-helpers.js";
export async function googleUserLogin(messageData, ws, Member) {
    // 輸出接收到的訊息，便於調試
    console.log("處理聊天訊息", messageData.googleUserLogin);

    // 檢查 messageData 是否包含 googleUserLogin 物件
    if (messageData.googleUserLogin.googlesub !== "") {
        try {
            // 如果有TOKEN，先查詢資料庫是否有此 sauser_accessToken
            const existingMember = await Member.findOne({
                sauser_accessToken:
                    messageData.googleUserLogin.sauser_accessToken, // 根據傳入的 sauser_accessToken 查詢
            });

            console.log(existingMember); // 輸出查詢結果，便於調試

            if (
                existingMember &&
                messageData.googleUserLogin.sauser_accessToken
            ) {
                // 如果找到資料庫中有此 sauser_accessToken 的會員，接著驗證 googleSub 是否匹配
                if (
                    existingMember.googlesub ===
                    messageData.googleUserLogin.googleSub
                ) {
                    // 完全匹配，表示這個 sauser_accessToken 與 googleSub 配對成功
                    ws.send(
                        JSON.stringify({
                            googleUserLogin: {
                                status: "success", // 登入成功
                                sauser_accessToken:
                                    messageData.googleUserLogin
                                        .sauser_accessToken, // 回傳 sauser_accessToken
                            },
                        })
                    );
                } else {
                    // 如果 sauser_accessToken 存在但 googleSub 不匹配，表示帳號綁定衝突
                    ws.send(
                        JSON.stringify({
                            googleUserLogin: {
                                status: "fail", // 登入失敗
                                message: "accountBindingConflict", // 需要綁定帳號
                            },
                        })
                    );
                }
            } else {
                // 如果沒有找到相對應的 sauser_accessToken，接著檢查是否有相同的 googlesub
                const existingGooglesub = await Member.findOne({
                    googlesub: messageData.googleUserLogin.googleSub, // 根據傳入的 googleSub 查詢
                });

                if (existingGooglesub && existingGooglesub.sauser_accessToken) {
                    // 如果找到了相同的 googlesub 並且該用戶有 sauser_accessToken
                    const accessTokenFromDB =
                        existingGooglesub.sauser_accessToken;
                    // 回傳已經存在的 sauser_accessToken
                    ws.send(
                        JSON.stringify({
                            googleUserLogin: {
                                status: "success", // 登入成功
                                sauser_accessToken: accessTokenFromDB, // 回傳資料庫中找到的 sauser_accessToken
                            },
                        })
                    );
                } else {
                    // 如果找到了 googlesub 但資料庫中沒有 sauser_accessToken，表示需要註冊來綁定帳號
                    ws.send(
                        JSON.stringify({
                            googleUserLogin: {
                                status: "fail", // 登入失敗
                                message: "needRegisterToBindAccount", // 需要註冊並綁定帳號
                            },
                        })
                    );
                }
            }
        } catch (error) {
            // 異常處理，捕獲並回傳內部伺服器錯誤
            console.error("[Database] Error processing login:", error);
            ws.send(
                JSON.stringify({
                    googleUserLogin: {
                        status: "error", // 發生錯誤
                        message: "Internal server error", // 內部伺服器錯誤
                        error: error.message, // 顯示錯誤訊息
                    },
                })
            );
        }
    }
}
