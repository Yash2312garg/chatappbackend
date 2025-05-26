const express = require('express')
const {authenticateUser} =require( "../../middlewares/authTokenMiddleware")
// const {sendRequest}= require("../../Controllers/frinendsController/friendsController")
const {sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    blockUser,
    unblockUser,
    unfriend,
    viewFriends,
    viewPendingRequests,
    getBlockedUsers,
    getRecentlyAddedFriends
} = require("../../Controllers/frinendsController/friendsController")



const router = express.Router();

router.post("/sendrequest",authenticateUser,sendFriendRequest)
router.post("/acceptFriendRequest",authenticateUser,acceptFriendRequest)
router.post("/cancelFriendRequest",authenticateUser,cancelFriendRequest)
router.post("/blockUser",authenticateUser,blockUser)
router.post("/rejectFriendRequest",authenticateUser,rejectFriendRequest)
router.post("/unblockUser",authenticateUser,unblockUser)
router.post("/unfriend",authenticateUser,unfriend)
router.get("/pendingrequest",authenticateUser,viewPendingRequests)
router.get("/blockedUser",authenticateUser,getBlockedUsers)
router.get("/recentlyAddedFriends", authenticateUser,getRecentlyAddedFriends)



// router.post("/viewFriends",authenticateUser,viewFriends)


module.exports = router