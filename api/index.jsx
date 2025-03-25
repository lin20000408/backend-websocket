const express = require("express");
const ServerSocket = require("ws").Server;
const mongoose = require("mongoose"); // 加入 MongoDB 套件

const PORT = 8080;

// 連接到 MongoDB
mongoose
    .connect(
        "mongodb+srv://web1:webdevbyjasmine@cluster0.cfv4c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => {
        console.log("[Database] Connected to MongoDB");
    })
    .catch((err) => {
        console.error("[Database] Connection error:", err);
    });

//伺服器設置
const server = express().listen(PORT, () =>
    console.log(`[Server] Listening on https://localhost:${PORT}`)
);

const wss = new ServerSocket({ server });

wss.on("connection", (ws, req) => {
    //設置連接事件處理程序 使用 WebSocket 密鑰的前 8 個字符為每個客戶端分配唯一 ID
    ws.id = req.headers["sec-websocket-key"].substring(0, 8);
    ws.send(`[Client ${ws.id} is connected!]`);
    //訊息處理
    ws.on("message", async (data) => {
        try {
            const messageData = JSON.parse(data.toString());

            console.log("[Message from client] data: ", data);

            // 根據訊息類型處理
            switch (true) {
                case messageData.userLogin !== undefined:
                    const loginData = messageData.userLogin;
                    if (
                        loginData.account === "030501" &&
                        loginData.password === "Pa$$w0rd"
                    ) {
                        ws.send(
                            JSON.stringify({
                                userLogin: {
                                    status: "success",
                                    sauser_accessToken:
                                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxLCJleHAiOjE3MzEwNDc0NjF9.jLvMeh0UJDcN47HxsqbAKFzhZfiTPMzZUOqPQpMu-gg",
                                    sauser_refreshToken:
                                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxfQ.jAsZ42xcCB4izy9qorBLGEJEcGLyq4eNb-AGc4ZugMQ",
                                },
                            })
                        );
                    } else {
                        ws.send(
                            JSON.stringify({
                                userLogin: {
                                    status: "error",
                                    message: "帳號或密碼錯誤",
                                },
                            })
                        );
                    }
                    break;
                case messageData.deleteWorkoutbuilder !== undefined:
                    console.log(
                        "處理聊天訊息",
                        messageData.deleteWorkoutbuilder
                    );
                    if (
                        messageData.deleteWorkoutbuilder 
                       
                    ) {
                        const messageSchema = new mongoose.Schema(
                            {
                                sauser_accessToken: String,
                                data: mongoose.Schema.Types.Mixed,
                            },
                            { collection: "Workoutbuilder" }
                        );
                
                        const Workoutbuilder = mongoose.model("Workoutbuilder", messageSchema);
                        try {
                       // Delete the document
            const deletedMessage = await Workoutbuilder.findOneAndDelete(
                { sauser_accessToken: messageData.deleteWorkoutbuilder.sauser_accessToken }
            );

            if (deletedMessage) {
                console.log("[Database] 刪除成功:", deletedMessage);
                ws.send(
                    JSON.stringify({
                        deleteWorkoutbuilder: {
                            status: "success",
                            message: "刪除成功"
                        },
                    })
                );}
                    } catch (error) {
                        console.error("[Database] 更新失敗:", error);
                        ws.send(
                            JSON.stringify({
                                deleteWorkoutbuilder: {
                                    status: "error",
                                    message: "更新失敗",
                                },
                            })
                        );
                    }
                    }
                    break;
                case messageData.getWorkoutbuilders !== undefined:
                    console.log("處理聊天訊息", messageData.getWorkoutbuilders);
                    if (
                        messageData.getWorkoutbuilders &&
                        messageData.getWorkoutbuilders.sauser_accessToken
                    ) {
                        ws.send(
                            JSON.stringify({
                                getWorkoutbuilders: {
                                    status: "success",
                                    data: [],
                                },
                            })
                        );
                    } else {
                        ws.send(
                            JSON.stringify({
                                getWorkoutbuilders: {
                                    status: "error",
                                    message: "錯誤",
                                },
                            })
                        );
                    }
                    break;
                case messageData.addNewWorkoutbuilder !== undefined:
                    console.log(
                        "處理聊天訊息",
                        messageData.addNewWorkoutbuilder
                    );
                    if (
                        messageData.addNewWorkoutbuilder &&
                        messageData.addNewWorkoutbuilder.data
                    ) {
                        // Define the schema for the message type
                        const messageSchema = new mongoose.Schema(
                            {
                                sauser_accessToken: String,
                                data: mongoose.Schema.Types.Mixed,
                            },
                            { collection: "Workoutbuilder" }
                        );

                        // Create Workoutbuilder model (this will use 'Workoutbuilder' as the collection name)
                        const Workoutbuilder = mongoose.model(
                            "Workoutbuilder",
                            messageSchema
                        );

                        // Save the message to the database
                        const newMessage = new Workoutbuilder({
                            sauser_accessToken:
                                messageData.addNewWorkoutbuilder
                                    .sauser_accessToken,
                            data: messageData.addNewWorkoutbuilder.data, // Ensure data is in string format
                        });

                        await newMessage.save();
                        console.log("[Database] Message saved");

                        ws.send(
                            JSON.stringify({
                                addNewWorkoutbuilder: {
                                    status: "success",
                                },
                            })
                        );
                    } else {
                        ws.send(
                            JSON.stringify({
                                addNewWorkoutbuilder: {
                                    status: "error",
                                    message: "錯誤",
                                },
                            })
                        );
                    }
                    break;
                    case messageData.updateWorkoutbuilder !== undefined:
                        console.log(
                            "處理聊天訊息",
                            messageData.updateWorkoutbuilder
                        );
                        if (
                            messageData.updateWorkoutbuilder &&
                            messageData.updateWorkoutbuilder.sauser_accessToken
                        ) {
                            // Define the schema (should ideally be outside the case statement)
                            const messageSchema = new mongoose.Schema(
                                {
                                    sauser_accessToken: String,
                                    data: mongoose.Schema.Types.Mixed,
                                },
                                { collection: "Workoutbuilder" }
                            );
                    
                            const Workoutbuilder = mongoose.model("Workoutbuilder", messageSchema);
                    
                            try {
                                // Check if data exists
                                const existingMessage = await Workoutbuilder.findOne({ 
                                    sauser_accessToken: messageData.updateWorkoutbuilder.sauser_accessToken 
                                });
                    
                                if (!existingMessage) {
                                    console.log("[Database] 找不到對應的資料，無法更新");
                                    ws.send(
                                        JSON.stringify({
                                            updateWorkoutbuilder: {
                                                status: "error",
                                                message: "找不到對應的資料",
                                            },
                                        })
                                    );
                                    break;
                                }
                    
                                // Update data
                                const updatedMessage = await Workoutbuilder.findOneAndUpdate(
                                    { sauser_accessToken: messageData.updateWorkoutbuilder.sauser_accessToken },
                                    { data: messageData.updateWorkoutbuilder.data },
                                    { new: true }
                                );
                    
                                console.log("[Database] 更新成功:", updatedMessage);
                                
                                ws.send(
                                    JSON.stringify({
                                        updateWorkoutbuilder: {
                                            status: "success",
                                        },
                                    })
                                );
                            } catch (error) {
                                console.error("[Database] 更新失敗:", error);
                                ws.send(
                                    JSON.stringify({
                                        updateWorkoutbuilder: {
                                            status: "error",
                                            message: "更新失敗",
                                        },
                                    })
                                );
                            }
                        }
                        break;
                default:
                    ws.send(
                        JSON.stringify({
                            status: "error",
                            message: "未知的訊息類型",
                        })
                    );
            }
        } catch (error) {
            console.error("[Database] Error saving message:", error);
        }
    });
    //連接關閉
    ws.on("close", () => {
        console.log("[Close connected]");
    });
});

// 處理未捕獲的錯誤
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

// 優雅地關閉連線 不做優雅關閉MongoDB 可能保留未正確關閉的連接，影響資料庫效能
process.on("SIGTERM", async () => {
    console.log("Shutting down...");
    await mongoose.connection.close();
    server.close();
    process.exit(0);
});
