const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const User = require("./models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs")
const cookieParser = require('cookie-parser')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const { Readable } = require('stream');
const ws = require("ws");
const Message = require("./models/message")
const { connection } = require('mongoose');
const contactRoutes = require('./Routes/contactus');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');
const { initWebSocketServer } = require('./Services/WebsoketService');
dotenv.config();


// CORS Configuration
app.use(cors({
    origin: "http://localhost:5173", // Allow requests from your frontend URL
    credentials: true, // Allow sending cookies and credentials, // Allow only these headers
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());



const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
mongoose.connect(process.env.DB_URL);


const bcryptSalt = bcrypt.genSaltSync(10)
const upload = multer({ dest: 'uploads/' });

app.get('/test', (req, res) => {
    res.json("test ok");
});

app.options('*', cors());
app.use('/contactus', contactRoutes);



// there shhould be username, userID, and  userProfile





//function to get profile

app.get("/profile", async (req, res) => {
    const token = req.cookies?.token;
    const jwtSecret = process.env.JWT_SECRET

    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err
            // const {id,username} = userData;
            const user = await User.findOne({ username: userData.username })
            res.json(user)
        })
    } else {
        res.status(401).json('no token')

    }
})

app.post('/uploadProfile', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        console.log(req.body.userId)
        console.log(req.body.purpose)


        const userData = await getUserDataFromRequest(req);
        const purpose = req.body.purpose
        const ourUserId = userData.userId;


        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${ourUserId}/${purpose}/${Date.now().toString()}-${path.basename(req.file.originalname)}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };


        // Upload file to S3
        const uploadCommand = new PutObjectCommand(params);
        await s3Client.send(uploadCommand);
        const fileUrl = `https://${Date.now().toString()}_${ourUserId}_${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        const updates = {
            profilePicture: fileUrl
        }
        try {
            const updatedUser = await User.findOneAndUpdate({ username: userData.username }, { $set: updates },)
            console.log("profile picture succesffully updated")
            res.status(200).json({
                message: 'File uploaded successfully',
                fileUrl: fileUrl, // S3 file URL
            });

        } catch (e) {
            res.status(500).send('Error uploading file: ' + error.message);

        }

        //find the user and then update the image 

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file: ' + error.message);
    }
});
//helper function for api to retrieve message 
async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        const jwtSecret = process.env.JWT_SECRET;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) return reject(err); // Handle the error properly
                resolve(userData);
            });
        } else {
            reject("No token");
        }
    });
}


app.post("/profile/status", async (req, res) => {
    console.log(req.body)
    const { field, value } = req.body;
    if (!field || !value) {
        res.status(400).json({ message: "empty fields " })
    }
    try {
        const userData = await getUserDataFromRequest(req);
        console.log(userData,req.body)
        const ourUserId = userData.userId;
        const updates = { [field.toLowerCase()]: value };
        
        const updatedUser = await User.findOneAndUpdate(
            { _id: ourUserId },  // Find user by ID
            { $set: updates },   // Update the specific field
            { new: true }        // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });


    } catch (e) {
        console.log(e)
        res.status(400).json({ message: "internal server error" })
    }
})

//api to get messages 
app.get("/messages/:userId", async (req, res) => {
    try {

        const { userId } = req.params;
        const userData = await getUserDataFromRequest(req); // Await the function
        const ourUserId = userData.userId;
        const messages = await Message.find({
            sender: { $in: [userId, ourUserId] },
            recipient: { $in: [userId, ourUserId] }
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(400).json({ message: error.toString() }); // Handle errors
    }
});

//api to fetch all the users 
app.get("/people", async (req, res) => {
    const users = await User.find({});
    res.json(users)
}, [])

//api for login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });
    // console.log(foundUser,)
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password)
        if (passOk) {
            const jwtSecret = process.env.JWT_SECRET
            const token = jwt.sign(
                { userId: foundUser._id, username: foundUser.username }, // Payload
                jwtSecret, // Secret
                {} // Options (you can customize if needed)
            );

            // Log the token to verify
            // console.log(token);

            // Send the token as a cookie and respond with the user ID
            res.cookie('token', token, {
                httpOnly: true,       // Not accessible via JavaScript
                secure: false,        // In development, since we're using HTTP on localhost
                sameSite: 'lax',      // Protect against CSRF, works fine for most use cases
                // maxAge: 24 * 60 * 60 * 1000, // 1 day
                path: '/'
            }) // Ensure the cookie is secure (use 'secure' flag in production)
                .status(201)
                .json({
                    id: foundUser._id,
                    username: foundUser.username
                });
        } else {
            res.status(401).json({ message: "Invalid password" });
        }
    }
})
//api for registering users
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    // console.log(req.body);

    if (!username || !password) {
        // console.log("is not uer name or password", username, password)
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if user with the same username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            // console.log("User already exist", username, password)
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new user with the provided username and password
        // console.log("User  created", username, password)
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await User.create({
            username: username,
            password: hashedPassword
        }); // Ensure this uses the correct field name

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET

        // console.log(createdUser._id, jwtSecret)

        const token = jwt.sign(
            { userId: createdUser._id, username: createdUser.username }, // Payload
            jwtSecret, // Secret
            {} // Options (you can customize if needed)
        );

        // Log the token to verify
        // console.log(token);

        // Send the token as a cookie and respond with the user ID
        res.cookie('token', token, {
            httpOnly: true,       // Not accessible via JavaScript
            secure: false,        // In development, since we're using HTTP on localhost
            sameSite: 'lax',      // Protect against CSRF, works fine for most use cases
            // maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/'
        }) // Ensure the cookie is secure (use 'secure' flag in production)
            .status(201)
            .json({
                id: createdUser._id,
                username: createdUser.username
            });

        // console.log("response sent", username, password)

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,    // Set to true if you are using HTTPS
        sameSite: 'lax',
        path: '/'
    }).status(200).json({ message: "Logged out successfully" });
});

const server = app.listen(process.env.PORT, () => {
    console.log("Server running on port 4000");
});

//initialising websockets for two way communication between the users..........---> <---
initWebSocketServer(server);
