import  contactFormSend  from './../../../helpers/email-helpers.js'
export async function userLogin(messageData, ws) {
    console.log("處理聊天訊息", messageData.userLogin);
    if (messageData.userLogin) {
        try {
         
     function generateRandomString() {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    return Array(16)
                      .fill()
                      .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
                      .join('');
                  }
                  
                  console.log(generateRandomString()); 
            ws.send(
                JSON.stringify({
                    userLogin: {
                        status: "success",
                        sauser_accessToken: generateRandomString,
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
