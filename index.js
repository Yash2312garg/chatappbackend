const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const http = require('http');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const cookieParser = require('cookie-parser')
const contactRoutes = require('./Routes/contactus');
const authRoutes = require("./Routes/Auth/authRoutes")
const userRoutes = require("./Routes/user/userRoutes")
const friendsRoutes = require("./Routes/Friends/addFriendsRouts")
const chatRoutes = require("./Routes/Chat/chatRoutes")
const socketio = require('socket.io');



// CORS Configuration
app.use(cors({
    origin: process.env.CLIENT_URL, // Allow requests from your frontend URL
    credentials: true, // Allow sending cookies and credentials, // Allow only these headers
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


//client connection
require('./config/db');



app.options('*', cors());



//routes
app.use('/contactus', contactRoutes);
app.use('/auth', authRoutes)
app.use('/user/', userRoutes)
app.use('/friends', friendsRoutes)
app.use('/chat',chatRoutes)

const PORT = process.env.PORT || 5000;




//socket initialisation
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
require("./socket")(io);

app.get('/test', (req, res) => {
    res.json("test ok");
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
