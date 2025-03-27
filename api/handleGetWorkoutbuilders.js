
 export async function handleGetWorkoutbuilders(messageData, ws, Workoutbuilder) {
    console.log("處理聊天訊息", messageData.getWorkoutbuilders);
    if (
        messageData.getWorkoutbuilders &&
        messageData.getWorkoutbuilders.sauser_accessToken
    ) {
        try {
            const result = await Workoutbuilder.findOne({
                sauser_accessToken:
                    messageData.getWorkoutbuilders.sauser_accessToken,
            });

            if (!result) {
                console.log("No document found with this access token");
                ws.send(
                    JSON.stringify({
                        getWorkoutbuilders: {
                            status: "error",
                            message: "No document found",
                        },
                    })
                );
                return;
            }

            ws.send(
                JSON.stringify({
                    getWorkoutbuilders: {
                        status: "success",
                        data: result.data,
                    },
                })
            );
            console.log(result);
        } catch (error) {
            console.error("Error fetching data:", error);
            ws.send(
                JSON.stringify({
                    getWorkoutbuilders: {
                        status: "error",
                        message: "錯誤",
                    },
                })
            );
        }
    }
}

