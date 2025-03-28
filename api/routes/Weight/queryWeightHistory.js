export async function queryWeightHistory(messageData, ws, Weight) {
    console.log("處理聊天訊息", messageData.queryWeightHistory);
    if (
        messageData.queryWeightHistory &&
        messageData.queryWeightHistory.sauser_accessToken
    ) {
    
        const sauser_accessToken = messageData.queryWeightHistory.sauser_accessToken; // 假設消息中包含此字段
    
        if (!sauser_accessToken) {
            ws.send(JSON.stringify({
                queryWeightHistory: {
                    status: "error",
                    message: "缺少 sauser_accessToken"
                }
            }));
            return;
        }
    
        try {
            const result = await Weight.aggregate([
                // 匹配特定的 sauser_accessToken
                { $match: { sauser_accessToken } },
                // 展開 data 陣列
                { $unwind: "$data" },
                // 過濾 createdAt 在指定範圍內的項目
                {
                    $match: {
                        "data.createdAt": {
                            $gte: new Date(messageData.queryWeightHistory.startDate),
                            $lte: new Date(messageData.queryWeightHistory.endDate)
                        }
                    }
                },
                // 按 createdAt 排序（可選）
                { $sort: { "data.createdAt": 1 } },
                // 重新組合成想要的格式
                {
                    $group: {
                        _id: "$_id",
                        sauser_accessToken: { $first: "$sauser_accessToken" },
                        data: { $push: "$data" }
                    }
                }
            ]);
    
            if (result.length === 0) {
                ws.send(JSON.stringify({
                    queryWeightHistory: {
                        status: "success",
                        data: []
                    }
                }));
                return;
            }
    
            ws.send(JSON.stringify({
                queryWeightHistory: {
                    status: "success",
                    data: result[0].data // 返回過濾後的 data 陣列
                }
            }));
        } catch (error) {
            ws.send(JSON.stringify({
                queryWeightHistory: {
                    status: "error",
                    message: "查詢失敗"
                }
            }));
            throw error;
        }
    }
}