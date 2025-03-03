import { Server } from "socket.io";
import { createServer } from "http";
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin : '*',
    methods: ["GET", "POST"],
  },
});

let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  socket.on("newUser", (userId) => {
    addNewUser(userId, socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
  console.log(onlineUsers);
  socket.on(
    "sendNotification",
    ({
      senderId,
      sender_first_name,
      sender_last_name,
      sender_picture,
      receiverId,
      type,
      postId,
      commentId,
      link,
      description,
      id,
      createdAt,
    }) => {
      const receiver = getUser(receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit("getNotification", {
          senderId,
          sender_first_name,
          sender_last_name,
          sender_picture,
          type,
          postId,
          commentId,
          link,
          description,
          id,
          createdAt,
        });
      }
    }
  );
  socket.on("sendMessage", ({ senderId, receiverId , roomId }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        roomId,
      });
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

io.listen(5000);
