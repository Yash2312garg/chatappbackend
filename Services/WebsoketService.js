const ws = require("ws");
const jwt = require('jsonwebtoken');
const { broadcastOnlineUsers } = require('../Utils/broadcastUtils');
const { verifyToken } = require('../Utils/jwtUtils');
const Message = require("../models/message");
const activeUsers = new Map();  // Store connections per userId

function initWebSocketServer(server) {
    const wss = new ws.WebSocketServer({ server });

    wss.on("connection", (connection, req) => {
        const cookies = req.headers.cookie;
        if (cookies) {
            const tokenCookieString = cookies.split(";").find(str => str.trim().startsWith("token="));
            const token = tokenCookieString?.split("=")[1];

            if (token) {
                verifyToken(token, (err, userData) => {
                    if (err) return connection.close(); // Invalid token

                    
                    const { userId, username } = userData;
                    connection.userId = userId;
                    connection.userName = username;
                    
                    if (!activeUsers.has(userId)) {
                        activeUsers.set(userId, []);
                    }
                    activeUsers.get(userId).push(connection);
                    broadcastOnlineUsers(wss, activeUsers);
                });
            }
        }

        connection.on('message', (message) => handleMessage(connection, message));

        connection.on('close', () => handleDisconnection(wss,connection));
    });

    return wss;
}

async function handleMessage(connection, message) {
    const messageData = JSON.parse(message.toString());
    const { recipient, text } = messageData;

    if (recipient && text) {
        const messageDoc = await Message.create({
            sender: connection.userId,
            recipient,
            text
        });

        const recipientConnections = activeUsers.get(recipient);
        connection.send(JSON.stringify({ text, sender: connection.userId, _id: messageDoc._id }));

        if (recipientConnections) {
            recipientConnections.forEach((c) => {
                if (c.readyState === ws.OPEN) {
                    c.send(JSON.stringify({ text, sender: connection.userId, _id: messageDoc._id }));
                }
            });
        }
    }
}

function handleDisconnection(wss,connection) {
    const userConnections = activeUsers.get(connection.userId);
    if (userConnections) {
        const updatedConnections = userConnections.filter(conn => conn !== connection);
        if (updatedConnections.length > 0) {
            activeUsers.set(connection.userId, updatedConnections);
        } else {
            activeUsers.delete(connection.userId);
        }
        broadcastOnlineUsers(wss, activeUsers);
    }
}

module.exports = {
    initWebSocketServer,
};
