export async function userAuth(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.userAuth);
    if (messageData.userAuth) {
        try {
            // 尋找現有的 workout 記錄
            let existingWorkout = await Member.findOne({
                sauser_accessToken: messageData.userAuth.sauser_accessToken,
            });

            if (existingWorkout) {
                ws.send(
                    JSON.stringify({
                        userAuth: {
                            status: "success",
                        },
                    })
                );
                return existingWorkout;
            } else {
                ws.send(
                    JSON.stringify({
                        userAuth: {
                            status: "fail",
                            message: "nonExistentUser",
                        },
                    })
                );
            }
        } catch (error) {
            ws.send(
                JSON.stringify({
                    userAuth: {
                        status: "error",
                        message: "錯誤",
                    },
                })
            );
            throw error; // 可選：拋出錯誤以便上層處理
        }
    }
}
