import express from "express";
import WebSocket, { WebSocketServer } from "ws"; // 正確匯入方式
import mongoose from "mongoose";
import { handleDeleteWorkoutbuilder } from "./handleDeleteWorkoutbuilder.js";
import { handleGetWorkoutbuilders } from "./handleGetWorkoutbuilders.js";
import { handleAddNewWorkoutbuilder } from "./handleAddNewWorkoutbuilder.js";
import { handleUpdateWorkoutbuilder } from "./handleUpdateWorkoutbuilder.js";
//weight
import { handleAddWeight } from "./routes/Weight/handleAddWeight.js";
import { queryWeightHistory } from "./routes/Weight/queryWeightHistory.js";
//login
import { userLogin } from "./routes/Auth/userLogin.js";
import { verifyUserEmail } from "./routes/Email/verifyUserEmail.js";
import { confirmUserEmail } from "./routes/Email/verifyUserEmail.js";
import { userRegister } from "./routes/Email/verifyUserEmail.js";
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

//?集合－weight Define the schema for the message type
const messageWeightSchema = new mongoose.Schema(
    {
        sauser_accessToken: {
            type: String,
            required: true,
        },
        data: [
            {
                weight: {
                    type: Number,
                    required: true,
                },
                units: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        collection: "Weight", // 改為 "Weight" 集合
        timestamps: true,
        // 自定義 JSON 輸出格式
        toJSON: {
            transform: (doc, ret) => {
                // 將 data 陣列中的每個 createdAt 轉為無毫秒的 ISO 字符串
                ret.data = ret.data.map((item) => ({
                    ...item,
                    createdAt: item.createdAt
                        .toISOString()
                        .replace(/\.\d{3}Z$/, "Z"),
                }));
                // 轉換 document 級別的 timestamps
                ret.createdAt = ret.createdAt
                    .toISOString()
                    .replace(/\.\d{3}Z$/, "Z");
                ret.updatedAt = ret.updatedAt
                    .toISOString()
                    .replace(/\.\d{3}Z$/, "Z");
                return ret;
            },
        },
    }
); //data 包含 DATE UNIT WEIGHT

// 創建 Weight 模型
const Weight = mongoose.model("Weight", messageWeightSchema);
//?集合－member Define the schema for the message type
const memberSchema = new mongoose.Schema(
    {
        userID: {
            type: String,
            required: true,
            unique: true, // 確保 email 唯一
        },
        password: {
            type: String,
            required: true,
        },
        sauser_accessToken: {
            type: String,
            required: false, // 可選
        },
        email: {
            type: String,
   
            required: false, // 可選
        },
        googlesub: {
            type: String, // 第三方登入 ID
            required: false, // 可選
        },
        data: {
            type: mongoose.Schema.Types.Mixed, // 允許存放任何 JSON 物件
            required: true,
        },
    },
    {
        collection: "Member",
        timestamps: true,
    }
);

// 建立模型
const Member = mongoose.model("Member", memberSchema);

async function handleMessage(messageData, ws, Workoutbuilder, Weight) {
    if (messageData.deleteWorkoutbuilder !== undefined) {
        await handleDeleteWorkoutbuilder(messageData, ws, Workoutbuilder);
    } else if (messageData.getWorkoutbuilders !== undefined) {
        await handleGetWorkoutbuilders(messageData, ws, Workoutbuilder);
    } else if (messageData.addNewWorkoutbuilder !== undefined) {
        await handleAddNewWorkoutbuilder(messageData, ws, Workoutbuilder);
    } else if (messageData.updateWorkoutbuilder !== undefined) {
        await handleUpdateWorkoutbuilder(messageData, ws, Workoutbuilder);
    } else if (messageData.addNewWeight !== undefined) {
        await handleAddWeight(messageData, ws, Weight);
    } else if (messageData.queryWeightHistory !== undefined) {
        await queryWeightHistory(messageData, ws, Weight);
    } else if (messageData.userLogin !== undefined) {
        await userLogin(messageData, ws, Weight);
    } else if (messageData.verifyUserEmail !== undefined) {
        await verifyUserEmail(messageData, ws, Member);
    } else if (messageData.confirmUserEmail !== undefined) {
        await confirmUserEmail(messageData, ws,Member);
    } else if (messageData.userRegister !== undefined) {
        await userRegister(messageData, ws, Member);
    }
}
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

            await handleMessage(messageData, ws, Workoutbuilder, Weight);
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
