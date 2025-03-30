import express from "express";
import dotenv from 'dotenv';

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
import { googleUserLogin } from "./routes/Auth/googleUserLogin.js";
import { googleUserLoginRebinding } from "./routes/Auth/googleUserLoginRebinding.js";
import { userAuth} from "./routes/Auth/userAuth.js";
//email (no previous email)
import { verifyUserEmail } from "./routes/Email/verifyUserEmail.js";
import { confirmUserEmail } from "./routes/Email/verifyUserEmail.js";
import { userRegister } from "./routes/Email/verifyUserEmail.js";
import { updateUserProfile } from "./routes/Email/verifyUserEmail.js";
//forgetPassword email (need previous email)
import { forgetUserPassword } from "./routes/Email/forgetUserPassword.js";
import { confirmForgetUserPasswordCode} from "./routes/Email/forgetUserPassword.js";
import { confirmUpdateUserPassword} from "./routes/Email/forgetUserPassword.js";
//delete email (need previous email)
import { deleteUserAccount } from "./routes/Email/deleteUserAccount.js";
import {confirmDeleteUserAccount} from "./routes/Email/deleteUserAccount.js";





import { getUserProfile} from "./routes/Auth/getUserProfile.js";
dotenv.config()

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
            default: null,
        },
        email: { type: String, default: null }, // email 可選且預設為 null
        googlesub: {
            type: String,
            default: null,
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
// "firstName": "king",
//             "lastName": "wang",
//             "birthday": "08/07/1971",
//             "gender": "male",
//             "units":true,
//             "cm": 128,
//             "inch": 2,
//             "kg": 50,
//             "lb": 110,
//             "avatar": "https://powrplusbucket.s3.ap-northeast-1.amazonaws.com/userID-ivy@gmail.com/avatar/e99de8ba-b220-4f2f-b4b1-c6f427ba9d7e"}

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
        await userLogin(messageData, ws, Member);
    } else if (messageData.verifyUserEmail !== undefined) {
        await verifyUserEmail(messageData, ws, Member);
    } else if (messageData.confirmUserEmail !== undefined) {
        await confirmUserEmail(messageData, ws, Member);
    } else if (messageData.userRegister !== undefined) {
        await userRegister(messageData, ws, Member);
    } else if (messageData.googleUserLogin !== undefined) {
        await googleUserLogin(messageData, ws, Member);
    } else if (messageData.googleUserLoginRebinding !== undefined) {
        await googleUserLoginRebinding(messageData, ws, Member);
    } else if (messageData.updateUserProfile !== undefined) {
        await updateUserProfile(messageData, ws, Member);
    }else if (messageData.getUserProfile !== undefined) {
        await getUserProfile(messageData, ws, Member);
    }else if (messageData.userAuth !== undefined) {
        await userAuth(messageData, ws, Member);
    }else if (messageData.forgetUserPassword !== undefined) {
        await forgetUserPassword(messageData, ws, Member);
    }else if (messageData.confirmForgetUserPasswordCode !== undefined) {
        await confirmForgetUserPasswordCode(messageData, ws, Member);
    }else if (messageData.confirmUpdateUserPassword !== undefined) {
        await confirmUpdateUserPassword(messageData, ws, Member);
    }else if (messageData.deleteUserAccount !== undefined) {
        await deleteUserAccount(messageData, ws, Member);
    }else if (messageData.confirmDeleteUserAccount !== undefined) {
        await confirmDeleteUserAccount(messageData, ws, Member);
    }
}
// 連接到 MongoDB

const PORT = process.env.PORT || 8080;  // 預設值 3000
const HOSTNAME = process.env.HOSTNAME || 'http://localhost:8080';
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
    console.log(`[Server] Listening on ${HOSTNAME}`)
);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
    //設置連接事件處理程序 使用 WebSocket 密鑰的前 8 個字符為每個客戶端分配唯一 ID
    ws.id = req.headers["sec-websocket-key"].substring(0, 8);
    ws.send(JSON.stringify("Client is connected!"));
    //訊息處理
    ws.on("message", async (data) => {
        try {
            const messageData = JSON.parse(data.toString());

            console.log("Message from client data: ", data);

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
