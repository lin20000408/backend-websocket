
export async function handleUpdateWorkoutbuilder(messageData, ws, Workoutbuilder) {
    console.log("處理聊天訊息", messageData.updateWorkoutbuilder);
    if (
        messageData.updateWorkoutbuilder &&
        messageData.updateWorkoutbuilder.sauser_accessToken
    ) {
        try {
            // 首先嘗試更新特定的 data 項目
            const updateResult = await Workoutbuilder.updateOne(
                {
                    sauser_accessToken:
                        messageData.updateWorkoutbuilder.sauser_accessToken,
                    "data._id": messageData.updateWorkoutbuilder._id,
                },
                {
                    $set: {
                        "data.$": {
                            data: messageData.updateWorkoutbuilder.data,
                        },
                    },
                }
            );
            console.log(updateResult);

            // 檢查更新是否成功
            if (updateResult.modifiedCount === 0) {
                console.log("[Database] 找不到對應的資料，無法更新");
                ws.send(
                    JSON.stringify({
                        updateWorkoutbuilder: {
                            status: "error",
                            message: "找不到對應的資料或無需更新",
                        },
                    })
                );
                return;
            }

            ws.send(
                JSON.stringify({
                    updateWorkoutbuilder: {
                        status: "success",
                    },
                })
            );
        } catch (error) {
            console.error("[Database] Error updating workout item:", error);
            ws.send(
                JSON.stringify({
                    updateWorkoutbuilder: {
                        status: "error",
                        message: "更新過程中發生錯誤",
                        error: error.message,
                    },
                })
            );
        }
    }
}

