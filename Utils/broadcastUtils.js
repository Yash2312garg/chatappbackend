const ws = require("ws");


function broadcastOnlineUsers(wss, activeUsers) {
    const onlineUsers = [...activeUsers.keys()].map(userId => {
        const userConnections = activeUsers.get(userId);
        if (userConnections && userConnections.length > 0) {
            return {
                userId: userConnections[0].userId,
                username: userConnections[0].userName,
            };
        }
    });
    

    wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ online: onlineUsers }));
        }
    });
}

module.exports = {
    broadcastOnlineUsers,
};
