import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
    handleChatConnection,
    setIoInstance,
} from "./controllers/chatController.js";


dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(cors());


setIoInstance(io);
io.on("connection", (socket) => {
    handleChatConnection(socket);
});

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiesTopology: true,
})
    .then(() => {
        server.listen(process.env.PORT || 8080, () => console.log('Server running on port 8080'));
    })
    .catch((error) => console.log(error.message));