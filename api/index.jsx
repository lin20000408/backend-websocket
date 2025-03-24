const express = require('express');
const ServerSocket = require('ws').Server;
const mongoose = require('mongoose'); // 加入 MongoDB 套件

const PORT = 8080;

// 連接到 MongoDB
mongoose.connect('mongodb+srv://web1:webdevbyjasmine@cluster0.cfv4c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('[Database] Connected to MongoDB');
}).catch(err => {
    console.error('[Database] Connection error:', err);
});

// 定義訊息的 Schema
const messageSchema = new mongoose.Schema({
    clientId: String,
    message: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// 建立 Message model
const Message = mongoose.model('Message', messageSchema);

const server = express()
    .listen(PORT, () => console.log(`[Server] Listening on https://localhost:${PORT}`));

const wss = new ServerSocket({ server });

wss.on('connection', (ws, req) => {
    ws.id = req.headers['sec-websocket-key'].substring(0, 8);
    ws.send(`[Client ${ws.id} is connected!]`);

    ws.on('message', async (data) => {
        try {
            console.log('[Message from client] data: ', data);
            
            // 將訊息儲存到資料庫
            const newMessage = new Message({
                clientId: ws.id,
                message: data.toString() // 確保資料是字串格式
            });
            
            await newMessage.save();
            console.log('[Database] Message saved');

            // 廣播訊息給所有客戶端
            let clients = wss.clients;
            clients.forEach(client => {
                client.send(`${ws.id}: ${data}`);
            });
        } catch (error) {
            console.error('[Database] Error saving message:', error);
        }
    });

    ws.on('close', () => {
        console.log('[Close connected]');
    });
});

// 處理未捕獲的錯誤
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// 優雅地關閉連線
process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await mongoose.connection.close();
    server.close();
    process.exit(0);
});