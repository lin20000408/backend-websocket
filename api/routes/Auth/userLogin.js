import  contactFormSend  from './../../../helpers/email-helpers.js'
export async function userLogin(messageData, ws) {
    console.log("處理聊天訊息", messageData.userLogin);
    if (messageData.userLogin) {
        try {
            const email=messageData.userLogin.account
            const subject="otp verify"
            const message="123456"
            await contactFormSend(email, subject, message); // Added await for async operation
    
            ws.send(
                JSON.stringify({
                    userLogin: {
                        status: "success",
                        sauser_accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxLCJleHAiOjE3MzEwNDc0NjF9.jLvMeh0UJDcN47HxsqbAKFzhZfiTPMzZUOqPQpMu-gg",
                        sauser_refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxfQ.jAsZ42xcCB4izy9qorBLGEJEcGLyq4eNb-AGc4ZugMQ"
                    }
                })
            );
        } catch (error) {
            console.error("[Database] Error deleting workout item:", error);
            ws.send(
                JSON.stringify({
                    userLogin: {
                        status: "error",
                        message: "Internal server error during deletion",
                        error: error.message,
                    },
                })
            );
        }
    }
}
