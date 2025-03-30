import contactFormSend from "./../../../helpers/email-helpers.js";
export async function userLogin(messageData, ws, Member) {
    console.log("處理聊天訊息", messageData.userLogin);
    if (messageData.userLogin) {
        try {
            // Check if userID and password match
            const existingMember = await Member.findOne({
                $or: [
                    {
                        userID: messageData.userLogin.account,
                        password: messageData.userLogin.password,
                    },
                    {
                        email: messageData.userLogin.account,
                        password: messageData.userLogin.password,
                    },
                ],
            });

            if (existingMember) {
                // Define the random string generator
                function generateRandomString() {
                    const characters =
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    return Array(16)
                        .fill()
                        .map(() =>
                            characters.charAt(
                                Math.floor(Math.random() * characters.length)
                            )
                        )
                        .join("");
                }

                // Generate the access token once and reuse it
                const accessToken = generateRandomString();
                console.log("Generated access token:", accessToken);

                // Update the document (assuming sauser_accessToken is a field in the schema)
                if (!existingMember.sauser_accessToken) {
                    existingMember.sauser_accessToken = accessToken;
                    await existingMember.save(); // 記得儲存變更
                }
                console.log("Member updated in DB with token:", accessToken);

                // Send response to the client
                ws.send(
                    JSON.stringify({
                        userLogin: {
                            status: "success",
                            sauser_accessToken:
                                !existingMember.sauser_accessToken
                                    ? accessToken
                                    : existingMember.sauser_accessToken,
                            sauser_refreshToken:
                                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxfQ.jAsZ42xcCB4izy9qorBLGEJEcGLyq4eNb-AGc4ZugMQ",
                        },
                    })
                );
            } else {
                // Handle case where no user is found
                ws.send(
                    JSON.stringify({
                        userLogin: {
                            status: "error",
                            message: "Invalid userID or password",
                        },
                    })
                );
            }
        } catch (error) {
            console.error("[Database] Error processing login:", error);
            ws.send(
                JSON.stringify({
                    userLogin: {
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    },
                })
            );
        }
    }
}
