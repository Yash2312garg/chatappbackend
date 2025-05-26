const express = require('express');
const {authenticateUser} =require( "../../middlewares/authTokenMiddleware")
const {getAllConversations} = require("../../Controllers/chatController/getAllConversations")
const router = express.Router()


router.get("/getAllConversation", authenticateUser,getAllConversations)



module.exports = router