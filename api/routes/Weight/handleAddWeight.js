export async function handleAddWeight(messageData, ws, Weight) {

    console.log("處理聊天訊息", messageData.addNewWeight);
    if (
        messageData.addNewWeight
    ) {
        if (!messageData.addNewWeight) {
            return; // 如果沒有 addNewWeight 數據，直接返回
        }
    
        try {
            // 尋找現有的 workout 記錄
            let existingWorkout = await Weight.findOne({
                sauser_accessToken: messageData.addNewWeight.sauser_accessToken
            });
    
            if (existingWorkout) {
                // 如果找到記錄，就在現有的 data 陣列中新增一項
                existingWorkout.data.push({
                    weight: messageData.addNewWeight.weight,
                    units: messageData.addNewWeight.units,
                  
                });
    
                // 保存更新後的記錄
                await existingWorkout.save();
    
                ws.send(
                    JSON.stringify({
                        addNewWeight: {
                            status: "success"
                        }
                    })
                );
                return existingWorkout;
            } else {
                // 如果沒找到記錄，創建新的 workout
                const newWorkout = await Weight.create({
                    sauser_accessToken: messageData.addNewWeight.sauser_accessToken,
                    data: [{
                        weight: messageData.addNewWeight.weight,
                        units: messageData.addNewWeight.units,
                      
                    }]
                });
    
                ws.send(
                    JSON.stringify({
                        addNewWeight: {
                            status: "success"
                        }
                    })
                );
                return newWorkout;
            }
        } catch (error) {
            ws.send(
                JSON.stringify({
                    addNewWeight: {
                        status: "error",
                        message: "錯誤"
                    }
                })
            );
            throw error;
        }}

}