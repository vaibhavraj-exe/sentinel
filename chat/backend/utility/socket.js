import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
app.use(express.static("D:\\Sentinel\\chat\\backend\\uploads"));

app.use(
  cors({
    origin: ["http://10.5.252.5:3002", "http://localhost:3002"],
    credentials: true,
  })
);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://10.5.252.5:3002", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("connected: ", socket.id);
  const { userID } = socket.handshake.query;
  console.log("userID: ", userID);

  if (userID) onlineUsers[userID] = socket.id;

  io.emit("getOnlineUsers", onlineUsers);
  console.log("Online Users: ", onlineUsers);

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    delete onlineUsers[userID];
    io.emit("getOnlineUsers", onlineUsers);
  });
});

const getActiveUsers = (recieverID) => {
  return onlineUsers[recieverID];
};

export { io, app, server, getActiveUsers };
