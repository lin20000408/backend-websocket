
export async function handleAddNewWorkoutbuilder(messageData, ws, Workoutbuilder) {
    console.log("處理聊天訊息", messageData.addNewWorkoutbuilder);
    if (
        messageData.addNewWorkoutbuilder &&
        messageData.addNewWorkoutbuilder.data
    ) {
        try {
            // 尋找現有的 workout 記錄
            let existingWorkout = await Workoutbuilder.findOne({
                sauser_accessToken:
                    messageData.addNewWorkoutbuilder.sauser_accessToken,
            });

            if (existingWorkout) {
                // 如果找到記錄，就在現有的 data 陣列中新增一項
                existingWorkout.data.push({
                    data: messageData.addNewWorkoutbuilder.data,
                });

                // 保存更新後的記錄
                await existingWorkout.save();

                ws.send(
                    JSON.stringify({
                        addNewWorkoutbuilder: {
                            status: "success",
                        },
                    })
                );
                return existingWorkout;
            } else {
                // 如果沒找到記錄，創建新的 workout
                const newWorkout = await Workoutbuilder.create({
                    sauser_accessToken:
                        messageData.addNewWorkoutbuilder.sauser_accessToken,
                    data: [
                        {
                            data: messageData.addNewWorkoutbuilder.data,
                        },
                    ],
                });

                ws.send(
                    JSON.stringify({
                        addNewWorkoutbuilder: {
                            status: "success",
                        },
                    })
                );
                return newWorkout;
            }
        } catch (error) {
            ws.send(
                JSON.stringify({
                    addNewWorkoutbuilder: {
                        status: "error",
                        message: "錯誤",
                    },
                })
            );
            throw error; // 可選：拋出錯誤以便上層處理
        }
    }
}

