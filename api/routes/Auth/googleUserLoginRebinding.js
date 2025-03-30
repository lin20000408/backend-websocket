export async function googleUserLoginRebinding(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.googleUserLoginRebinding);
    if (
        messageData.googleUserLoginRebinding 
    ) {
        try {
            // 首先嘗試更新特定的 data 項目
            const updateResult = await Member.updateOne(
                {
                    userID: messageData.googleUserLoginRebinding.account,
                    password: messageData.googleUserLoginRebinding.password,
                },
                {
                    $set: {
                        googlesub:
                            messageData.googleUserLoginRebinding.googleSub,
                    },
                }
            );
            console.log(updateResult);

            // 檢查更新是否成功
            if (updateResult.modifiedCount === 0) {
                console.log("[Database] 找不到對應的資料，無法更新");
                ws.send(
                    JSON.stringify({
                        googleUserLoginRebinding: {
                            status: "error",
                            message: "找不到對應的資料或無需更新",
                        },
                    })
                );
                return;
            }

            ws.send(
                JSON.stringify({
                    googleUserLoginRebinding: {
                        status: "success",
                    },
                })
            );
        } catch (error) {
            console.error("[Database] Error updating workout item:", error);
            ws.send(
                JSON.stringify({
                    googleUserLoginRebinding: {
                        status: "error",
                        message: "更新過程中發生錯誤",
                        error: error.message,
                    },
                })
            );
        }
    }
}


