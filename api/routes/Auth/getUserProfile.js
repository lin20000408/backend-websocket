export async function getUserProfile(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.getUserProfile);
    if (
        messageData.getUserProfile &&
        messageData.getUserProfile.sauser_accessToken
    ) {
        try {
            const result = await Member.findOne({
                sauser_accessToken:
                    messageData.getUserProfile.sauser_accessToken,
            });

            if (!result) {
                console.log("No document found with this access token");
                ws.send(
                    JSON.stringify({
                        getUserProfile: {
                            status: "error",
                            message: "No document found",
                        },
                    })
                );
                return;
            }

            ws.send(
                JSON.stringify({
                    getUserProfile: {
                        status: "success",
                        data: {
                            firstName: result.data.firstName,
                            lastName: result.data.lastName,
                            birthday: result.data.birthday,
                            gender: result.data.gender,
                            units: result.data.units,
                            cm: result.data.cm|| null,
                            inch: result.data.inch|| null,
                            kg: result.data.kg|| null,
                            lb: result.data.lb|| null,
                            avatarUrl: result.data.avatar || null,
                            email: result.email|| null,
                        },
                    },
                })
            );
            console.log(result);
        } catch (error) {
            console.error("Error fetching data:", error);
            ws.send(
                JSON.stringify({
                    getUserProfile: {
                        status: "error",
                        message: "錯誤",
                    },
                })
            );
        }
    }
}
