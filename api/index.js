import express from "express";
import WebSocket, { WebSocketServer } from "ws"; // 正確匯入方式
import mongoose from "mongoose";
import { handleDeleteWorkoutbuilder } from "./handleDeleteWorkoutbuilder.js";
import { handleGetWorkoutbuilders } from "./handleGetWorkoutbuilders.js";
import { handleAddNewWorkoutbuilder } from "./handleAddNewWorkoutbuilder.js";
import { handleUpdateWorkoutbuilder } from "./handleUpdateWorkoutbuilder.js";

const PORT = 8080;
//?集合－workoutBuilder Define the schema for the message type
const messageSchema = new mongoose.Schema(
    {
        sauser_accessToken: {
            type: String,
            required: true,
        },
        data: [
            {
                data: {
                    type: mongoose.Schema.Types.Mixed,
                    required: true,
                },
            },
        ],
    },
    {
        collection: "Workoutbuilder",
        timestamps: true,
    }
);

// Create Workoutbuilder model
const Workoutbuilder = mongoose.model("Workoutbuilder", messageSchema);
async function handleMessage(messageData, ws, Workoutbuilder) {
    if (messageData.deleteWorkoutbuilder !== undefined) {
        await handleDeleteWorkoutbuilder(messageData, ws, Workoutbuilder);
    } else if (messageData.getWorkoutbuilders !== undefined) {
        await handleGetWorkoutbuilders(messageData, ws, Workoutbuilder);
    } else if (messageData.addNewWorkoutbuilder !== undefined) {
        await handleAddNewWorkoutbuilder(messageData, ws, Workoutbuilder);
    } else if (messageData.updateWorkoutbuilder !== undefined) {
        await handleUpdateWorkoutbuilder(messageData, ws, Workoutbuilder);
    }
}
//?集合－weight Define the schema for the message type
const messageWeightSchema = new mongoose.Schema(
    {
        sauser_accessToken: {
            type: String,
            required: true,
        },
        data: [
            {
                data: {
                    type: mongoose.Schema.Types.Mixed,
                    required: true,
                },
            },
        ],
    },
    {
        collection: "Weight", // 改為 "Weight" 集合
        timestamps: true,
    }
);//data 包含 DATE UNIT WEIGHT

// 創建 Weight 模型
const Weight = mongoose.model("Weight", messageWeightSchema);
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

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
    //設置連接事件處理程序 使用 WebSocket 密鑰的前 8 個字符為每個客戶端分配唯一 ID
    ws.id = req.headers["sec-websocket-key"].substring(0, 8);
    ws.send(`[Client ${ws.id} is connected!]`);
    //訊息處理
    ws.on("message", async (data) => {
        try {
            const messageData = JSON.parse(data.toString());

            console.log("[Message from client] data: ", data);

            await handleMessage(messageData, ws, Workoutbuilder);
            // 根據訊息類型處理
            //             switch (true) {
            //                 case messageData.userLogin !== undefined:
            //                     const loginData = messageData.userLogin;
            //                     if (
            //                         loginData.account === "030501" &&
            //                         loginData.password === "Pa$$w0rd"
            //                     ) {
            //                         ws.send(
            //                             JSON.stringify({
            //                                 userLogin: {
            //                                     status: "success",
            //                                     sauser_accessToken:
            //                                         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxLCJleHAiOjE3MzEwNDc0NjF9.jLvMeh0UJDcN47HxsqbAKFzhZfiTPMzZUOqPQpMu-gg",
            //                                     sauser_refreshToken:
            //                                         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJpdnlAZ21haWwuY29tIiwiaWF0IjoxNzMwOTYxMDYxfQ.jAsZ42xcCB4izy9qorBLGEJEcGLyq4eNb-AGc4ZugMQ",
            //                                 },
            //                             })
            //                         );
            //                     } else {
            //                         ws.send(
            //                             JSON.stringify({
            //                                 userLogin: {
            //                                     status: "error",
            //                                     message: "帳號或密碼錯誤",
            //                                 },
            //                             })
            //                         );
            //                     }
            //                     break;
            //                 case messageData.deleteWorkoutbuilder !== undefined:
            //                     console.log(
            //                         "處理聊天訊息",
            //                         messageData.deleteWorkoutbuilder
            //                     );
            //                     if (messageData.deleteWorkoutbuilder) {
            //                         try {
            //                             const updateResult = await Workoutbuilder.updateOne(
            //                                 {
            //                                     sauser_accessToken: messageData.deleteWorkoutbuilder.sauser_accessToken
            //                                 },
            //                                 {
            //                                     $pull: { data: { _id: messageData.deleteWorkoutbuilder._id } }
            //                                 }
            //                             );

            //                             console.log("Update result:", updateResult);

            //                             if (updateResult.modifiedCount === 0) {
            //                                 console.log("[Database] No matching document or item found");
            //                                 ws.send(
            //                                     JSON.stringify({
            //                                         deleteWorkoutbuilder: {
            //                                             status: "error",
            //                                             message: "No matching document or item found"
            //                                         }
            //                                     })
            //                                 );
            //                                 return;
            //                             }

            //                             ws.send(
            //                                 JSON.stringify({
            //                                     deleteWorkoutbuilder: {
            //                                         status: "success"
            //                                     }
            //                                 })
            //                             );

            //                         } catch (error) {
            //                             console.error("[Database] Error deleting workout item:", error);
            //                             ws.send(
            //                                 JSON.stringify({
            //                                     deleteWorkoutbuilder: {
            //                                         status: "error",
            //                                         message: "Internal server error during deletion",
            //                                         error: error.message
            //                                     }
            //                                 })
            //                             );
            //                         }

            //                     }
            //                     break;
            //                 case messageData.getWorkoutbuilders !== undefined:
            //                     console.log("處理聊天訊息", messageData.getWorkoutbuilders);
            //                     if (
            //                         messageData.getWorkoutbuilders &&
            //                         messageData.getWorkoutbuilders.sauser_accessToken
            //                     ) {
            //                         try {
            //                             const result = await Workoutbuilder.findOne(
            //                                 {
            //                                     sauser_accessToken:
            //                                         messageData.getWorkoutbuilders
            //                                             .sauser_accessToken,
            //                                 }
            //                                 // { data: 1, _id: 0 }
            //                             ); // 只選擇 data 字段，排除 _id)
            //                             if (!result) {
            //                                 console.log(
            //                                     "No document found with this access token"
            //                                 );
            //                                 return null;
            //                             }
            //                             // const renamedData = result.data.map((item) => {
            //                             //     const newItem = { ...item._doc }; // Extract the raw data from _doc
            //                             //     newItem._id = newItem.workoutBuilder_id;
            //                             //     delete newItem.workoutBuilder_id;
            //                             //     return newItem;
            //                             // });
            //                             // console.log(renamedData);
            //                             ws.send(
            //                                 JSON.stringify({
            //                                     getWorkoutbuilders: {
            //                                         status: "success",
            //                                         data: result.data,
            //                                     },
            //                                 })
            //                             );
            //                             console.log(result);
            //                         } catch (error) {
            //                             console.error("Error fetching data:", error);
            //                             ws.send(
            //                                 JSON.stringify({
            //                                     getWorkoutbuilders: {
            //                                         status: "error",
            //                                         message: "錯誤",
            //                                     },
            //                                 })
            //                             );
            //                         }
            //                     }
            //                     break;
            //                 case messageData.addNewWorkoutbuilder !== undefined:
            //                     console.log(
            //                         "處理聊天訊息",
            //                         messageData.addNewWorkoutbuilder
            //                     );
            //                     if (
            //                         messageData.addNewWorkoutbuilder &&
            //                         messageData.addNewWorkoutbuilder.data
            //                     ) {
            //                         try {
            //                             // 尋找現有的 workout 記錄
            //                             let existingWorkout = await Workoutbuilder.findOne({
            //                                 sauser_accessToken:
            //                                     messageData.addNewWorkoutbuilder
            //                                         .sauser_accessToken,
            //                             });

            //                             if (existingWorkout) {
            //                                 // 如果找到記錄，就在現有的 data 陣列中新增一項
            //                                 existingWorkout.data.push({
            //                                     data: messageData.addNewWorkoutbuilder.data,
            //                                 });

            //                                 // 保存更新後的記錄
            //                                 await existingWorkout.save();

            //                                 ws.send(
            //                                     JSON.stringify({
            //                                         addNewWorkoutbuilder: {
            //                                             status: "success",
            //                                         },
            //                                     })
            //                                 );
            //                                 return existingWorkout;
            //                             } else {
            //                                 // 如果沒找到記錄，創建新的 workout
            //                                 const newWorkout = await Workoutbuilder.create({
            //                                     sauser_accessToken:
            //                                         messageData.addNewWorkoutbuilder
            //                                             .sauser_accessToken,
            //                                     data: [
            //                                         {
            //                                             data: messageData
            //                                                 .addNewWorkoutbuilder.data,
            //                                         },
            //                                     ],
            //                                 });

            //                                 ws.send(
            //                                     JSON.stringify({
            //                                         addNewWorkoutbuilder: {
            //                                             status: "success",
            //                                         },
            //                                     })
            //                                 );
            //                                 return newWorkout;
            //                             }
            //                         } catch (error) {
            //                             ws.send(
            //                                 JSON.stringify({
            //                                     addNewWorkoutbuilder: {
            //                                         status: "error",
            //                                         message: "錯誤",
            //                                     },
            //                                 })
            //                             );
            //                             throw error; // 可選：拋出錯誤以便上層處理
            //                         }
            //                     }
            //                     break;
            //                 case messageData.updateWorkoutbuilder !== undefined:
            //                     console.log(
            //                         "處理聊天訊息",
            //                         messageData.updateWorkoutbuilder
            //                     );
            //                     if (
            //                         messageData.updateWorkoutbuilder &&
            //                         messageData.updateWorkoutbuilder.sauser_accessToken
            //                     ) {
            //                         // 首先嘗試更新特定的 data 項目
            //                         const updateResult = await Workoutbuilder.updateOne(
            //                             {
            //                                 sauser_accessToken:
            //                                     messageData.updateWorkoutbuilder
            //                                         .sauser_accessToken,
            //                                 "data._id":
            //                                     messageData.updateWorkoutbuilder._id,
            //                             },
            //                             {
            //                                 $set: {
            //                                     "data.$": {

            //                                         data: messageData.updateWorkoutbuilder
            //                                             .data,
            //                                     },
            //                                 },
            //                             }
            //                         );
            //                         console.log(updateResult);

            //                         ws.send(
            //                             JSON.stringify({
            //                                 updateWorkoutbuilder: {
            //                                     status: "success",
            //                                 },
            //                             })
            //                         );
            //                         // 檢查更新是否成功
            //                         if (updateResult.modifiedCount === 0) {
            //                             console.log(
            //                                 "[Database] 找不到對應的資料，無法更新"
            //                             );
            //                             ws.send(
            //                                 JSON.stringify({
            //                                     updateWorkoutbuilder: {
            //                                         status: "error",
            //                                         message: "找不到對應的資料或無需更新",
            //                                     },
            //                                 })
            //                             );
            //                             return;
            //                         }
            //                     }

            //                     break;
            //                case messageData.addNewWeight!== undefined:

            // break;
            //                     default:
            //                     ws.send(
            //                         JSON.stringify({
            //                             status: "error",
            //                             message: "未知的訊息類型",
            //                         })
            //                     );
            //             }
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
