
export async function handleDeleteWorkoutbuilder(messageData, ws, Workoutbuilder) {
    console.log("處理聊天訊息", messageData.deleteWorkoutbuilder);
    if (messageData.deleteWorkoutbuilder) {
        try {
            const updateResult = await Workoutbuilder.updateOne(
                {
                    sauser_accessToken: messageData.deleteWorkoutbuilder.sauser_accessToken,
                },
                {
                    $pull: { data: { _id: messageData.deleteWorkoutbuilder._id } },
                }
            );

            console.log("Update result:", updateResult);

            if (updateResult.modifiedCount === 0) {
                console.log("[Database] No matching document or item found");
                ws.send(
                    JSON.stringify({
                        deleteWorkoutbuilder: {
                            status: "error",
                            message: "No matching document or item found",
                        },
                    })
                );
                return;
            }

            ws.send(
                JSON.stringify({
                    deleteWorkoutbuilder: {
                        status: "success",
                    },
                })
            );
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    deleteWorkoutbuilder: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}

