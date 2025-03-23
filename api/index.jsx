const express = require('express');
const app = express();
const { WebSocketServer } = require('ws');
const mongoose = require("mongoose");
let connectStatus = false;

// MongoDB 連接
async function connectMongoDB() {
    try {
        await mongoose.connect('mongodb+srv://web1:webdevbyjasmine@cluster0.cfv4c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB...');
        connectStatus = true;
    } catch (error) {
        console.log(error);
    }
}

connectMongoDB();

app.use(express.json());

// 中間件檢查資料庫連接
app.use((req, res, next) => {
    if (connectStatus) {
        next();
    } else {
        res.status(503).send({
            status: false,
            message: 'Server is not ready'
        });
    }
});

// Todo Schema 和 Model
const todoSchema = new mongoose.Schema({
    id: Number,
    title: String,
    completed: Boolean,
});

const Todo = mongoose.model('Todo', todoSchema);

// 啟動 HTTP 服務器
const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 創建 WebSocket 服務器
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'GET_TODOS':
                    const todos = await Todo.find();
                    ws.send(JSON.stringify({
                        status: true,
                        type: 'TODOS_LIST',
                        data: todos
                    }));
                    break;

                case 'CREATE_TODO':
                    const { title, completed } = data.payload;
                    const todo = new Todo({
                        id: new Date().getTime(),
                        title,
                        completed,
                    });
                    await todo.save();
                    ws.send(JSON.stringify({
                        status: true,
                        type: 'TODO_CREATED',
                        message: 'Create todo successfully'
                    }));
                    // 廣播給所有客戶端
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                status: true,
                                type: 'TODOS_UPDATED',
                                data: [todo]
                            }));
                        }
                    });
                    break;

                default:
                    ws.send(JSON.stringify({
                        status: false,
                        message: 'Unknown command'
                    }));
            }
        } catch (error) {
            ws.send(JSON.stringify({
                status: false,
                message: 'Error processing request',
                error: error.message
            }));
        }
    });
    ws.on('error', (error) => {
        console.log('WebSocket error:', error);
    });
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

 
});

// 可選：保留 REST API
app.get('/todos', async (req, res) => {
    const todos = await Todo.find();
    res.send({
        status: true,
        data: todos,
    });
});

app.post('/todos', async (req, res) => {
    const { title, completed } = req.body;
    const todo = new Todo({
        id: new Date().getTime(),
        title,
        completed,
    });
    await todo.save();
    res.send({
        status: true,
        message: 'Create todo successfully',
    });
});

// const express=require('express')
// const app =express()
// const mongoose = require("mongoose");
// let connectStatus = false;
//     async function connectMongoDB () {
//         try {
//           await mongoose.connect('mongodb+srv://web1:webdevbyjasmine@cluster0.cfv4c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
//           console.log('Connected to MongoDB...')
//           connectStatus = true;//connect true
//         } catch (error) {
//           console.log(error)
//         }
//       }
      
//       connectMongoDB()
      
    
      
//       app.use(express.json());
//       //!middleWare :connect true next,false 攔截
//       app.use((req, res, next) => {
//         if (connectStatus) {
//           next();
//         } else {
//           res.status(503).send({
//             status: false,
//             message: 'Server is not ready'
//           });
//         }
//       })
      
// //定義完 Schema 之後，接著就是要來建立 Model，通常 Modal 會對應特定的 Schema，而且每個 Model 都會跟資料庫中的一個 collection 對應，也就是說，我們可以透過 Model 來存取資料庫中的資料。
//       const todoSchema = new mongoose.Schema({
//         id: Number,
//         title: String,
//         completed: Boolean,
//       });
      
//       const Todo = mongoose.model('Todo', todoSchema);
      
//       app.get('/todos', async (req, res) => {
//         const todos = await Todo.find();
//         res.send({
//           status: true,
//           data: todos,
//         });
//       });
      
//       app.post('/todos', async (req, res) => {
//         const { title, completed } = req.body;
      
//         const todo = new Todo({
//           id: new Date().getTime(),
//           title,
//           completed,
//         });
      
//         await todo.save();
//         res.send({
//           status: true,
//           message: 'Create todo successfully',
//         });
//       });
// // 啟動 Express 伺服器
// const PORT = process.env.PORT || 3000; // 使用環境變數中的 PORT，或預設為 3000
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });