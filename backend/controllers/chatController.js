import Message from "../models/Message";

const activeUsers = new Map();
const chatHistoryCache = new Map();

let ioInstance;

export const setIoInstance = (io) => {
    ioInstance = io;
};

export const handleChatConnection = (socket) => {
    console.log(`Socket ${socket.id} connected.`);

    socket.on("join_chat", async({userId}) => {
        try {
            socket.join(userId);

            const cachedHistory = chatHistoryCache.get(userId);

            if(cachedHistory) {
                socket.emit("chat_history", cachedHistory);
            } else {
                const chatHistory = await Message.find({
                    $or: [{senderId: userId}, {recipientId: userId}],
                }).sort({createdAt: "asc"});

                socket.emit("chat_history", chatHistory);
                chatHistoryCache.set(userId, chatHistory);
            }

            activeUsers.set(socket.id, {userId, socket});
            ioInstance.emit(
                "active_users",
                [...activeUsers.values()].map((user) => user.userId)
            );
        } catch (error) {
            console.error("Error joining chat", error);
        }
    });

    socket.on("send_message", async ({senderId, recipientId, message}) => {
        try {
            const newMessage = await Message.create({
                senderId,
                recipientId,
                message,
            });

            const recipientSocket = [...activeUsers.values()].find(
                (user) => user.userId === recipientId
            )?.socket;

            if(recipientSocket) {
            recipientSocket.emit("receive_message", {
                senderId,
                message: newMessage.message,
                createdAt: newMessage.createdAt,
            });
        }
        } catch(error) {
            console.error("Error creating message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);

        activeUsers.delete(socket.id);

        ioInstance.emit(
            "active_users",
            [...activeUsers.values()].map((user) => user.userId)
        );
    })
}