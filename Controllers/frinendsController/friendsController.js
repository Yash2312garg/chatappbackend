const Friend = require('../../models/friendsmodels');
const mongoose = require('mongoose')
const UserConnections = require('../../models/Users/userConnections');
const User = require('../../models/Users/user')

// Fixed updateUserConnections function
const updateUserConnections = async (userId, otherUserId, action) => {
    try {
        // Validate inputs
        if (!userId || !otherUserId || !action) {
            throw new Error("Missing required parameters: userId, otherUserId, and action are required");
        }

        // Validate that action is a valid field name
        const validActions = ['contacts', 'blockedUsers']; // Updated to match actual field names
        if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
        }

        if (userId.toString() === otherUserId.toString()) {
            throw new Error(`cannot add yourself to your own action`);
        }

        const existingConnection = await UserConnections.findOne({
            userId,
            [`${action}.userId`]: otherUserId
        });

        if (existingConnection) {
            return existingConnection
        }

        // Using $addToSet to add the otherUserId to the array if it doesn't exist
        const userCon = await UserConnections.findOneAndUpdate(
            { userId },
            {
                $setOnInsert: { userId },
                $push: {
                    [action]: {
                        userId: otherUserId,
                        addedAt: new Date()
                    }
                }
            },
            { upsert: true, new: true }
        );
        console.log("UpdateUserConnections",userCon)
        return userCon;
    } catch (error) {
        console.error(`Error updating user connections: ${error.message}`);
        throw error;
    }
};


const sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { recipientId } = req.body;
        console.log("---------", senderId, recipientId)
        // Validate input
        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "Recipient ID is required"
            });
        }

        // Prevent sending request to self
        if (senderId === recipientId) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a friend request to yourself"
            });
        }

        // Check if request already exists
        const existing = await Friend.findOne({
            $or: [
                { userId: senderId, recipientId },
                { userId: recipientId, recipientId: senderId }
            ]
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Request or connection already exists"
            });
        }

        // Create and save new friend request
        const newRequest = new Friend({ userId: senderId, recipientId });
        await newRequest.save();

        console.log(newRequest)

        return res.status(201).json({
            success: true,
            message: 'Friend request sent'
        });

    } catch (error) {
        console.error("Error sending friend request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send friend request",
            error: error.message
        });
    }
}







const acceptFriendRequest = async (req, res) => {
    try {
        const recipientId = req.user.id;
        const { senderId } = req.body;
        console.log(recipientId, senderId)
        // Validate input
        if (!senderId) {
            return res.status(400).json({
                success: false,
                message: "Sender ID is required"
            });
        }

        // Find and update the friend request
        const request = await Friend.findOneAndUpdate(
            { userId: senderId, recipientId, status: "pending" },
            { status: "connected" },
            { new: true }
        );
        console.log(request)
        // Check if request was found
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found or already processed"
            });
        }

        // Update user connections for both users
        await Promise.all([
            updateUserConnections(senderId, recipientId, "contacts"),
            updateUserConnections(recipientId, senderId, "contacts")
        ]);

        return res.status(200).json({
            success: true,
            message: "Friend request accepted successfully"
        });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to accept friend request",
            error: error.message
        });
    }
};


const rejectFriendRequest = async (req, res) => {
    try {
        const { senderId } = req.body;
        const recipientId = req.user.id;

        // Validate input
        if (!senderId) {
            return res.status(400).json({
                success: false,
                message: "Sender ID is required"
            });
        }

        // Find and delete the friend request
        const rejectReq = await Friend.findOneAndDelete({
            userId: senderId,
            recipientId,
            status: "pending"
        });

        // Check if request was found
        if (!rejectReq) {
            return res.status(404).json({
                success: false,
                message: "No such pending friend request found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Friend request rejected successfully"
        });
    } catch (error) {
        console.error("Error rejecting friend request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject friend request",
            error: error.message
        });
    }
};

const cancelFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { recipientId } = req.body;

        // Validate input
        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "Recipient ID is required"
            });
        }

        // The findByIdAndUpdate method is incorrect here
        // Should use findOneAndDelete instead
        const deleted = await Friend.findOneAndDelete({
            userId: senderId,
            recipientId,
            status: 'pending'
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "No such pending request found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Friend request cancelled successfully"
        });
    } catch (error) {
        console.error("Error cancelling friend request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel friend request",
            error: error.message
        });
    }
};

// Block a user
const blockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetId } = req.body;

        // Validate input
        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: "Target user ID is required"
            });
        }

        // Prevent blocking yourself
        if (userId === targetId) {
            return res.status(400).json({
                success: false,
                message: "You cannot block yourself"
            });
        }

        // First, remove any existing friendship relationship
        await Friend.findOneAndDelete({
            $or: [
                { userId, recipientId: targetId },
                { userId: targetId, recipientId: userId }
            ]
        });

        // Create a new blocked relationship
        await Friend.findOneAndUpdate(
            { userId, recipientId: targetId },
            { status: "blocked" },
            { upsert: true }
        );

        // Update user connections
        await updateUserConnections(userId, targetId, "blockedUsers");

        // Also remove from contacts if they were friends
        await UserConnections.updateOne(
            { userId },
            { $pull: { contacts: targetId } }
        );

        await UserConnections.updateOne(
            { userId: targetId },
            { $pull: { contacts: userId } }
        );

        return res.status(200).json({
            success: true,
            message: "User blocked successfully"
        });
    } catch (error) {
        console.error("Error blocking user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to block user",
            error: error.message
        });
    }
};


// Unblock a user
const unblockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetId } = req.body;

        // Validate input
        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: "Target user ID is required"
            });
        }

        // Remove from blocked list
        const userConnectionsResult = await UserConnections.updateOne(
            { userId },
            { $pull: { blockedUsers: targetId } }
        );

        // Remove blocking relationship
        const friendResult = await Friend.findOneAndDelete({
            $or: [
                { userId, recipientId: targetId, status: "blocked" },
                { userId: targetId, recipientId: userId, status: "blocked" }
            ]
        });

        // Check if the user was actually unblocked
        if (userConnectionsResult.modifiedCount === 0 && !friendResult) {
            return res.status(404).json({
                success: false,
                message: "No blocking relationship found with this user"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User unblocked successfully"
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to unblock user",
            error: error.message
        });
    }
};

// Remove a friend connection
const unfriend = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetId } = req.body;

        // Validate input
        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: "Target user ID is required"
            });
        }

        // Remove friendship relation
        const friendResult = await Friend.findOneAndDelete({
            $or: [
                { userId, recipientId: targetId, status: "connected" },
                { userId: targetId, recipientId: userId, status: "connected" }
            ]
        });

        // If no friendship exists
        if (!friendResult) {
            return res.status(404).json({
                success: false,
                message: "No friendship exists with this user"
            });
        }

        // Remove from contacts lists (for both users)
        await Promise.all([
            UserConnections.updateOne(
                { userId },
                { $pull: { contacts: targetId } }
            ),
            UserConnections.updateOne(
                { userId: targetId },
                { $pull: { contacts: userId } }
            )
        ]);

        return res.status(200).json({
            success: true,
            message: "Unfriended successfully"
        });
    } catch (error) {
        console.error("Error unfriending user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to unfriend user",
            error: error.message
        });
    }
};

// View friends list
const viewFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user connections and populate friend details
        const connections = await UserConnections.findOne({ userId })
            .populate("contacts", "username fullName email profilePicture");

        return res.status(200).json({
            success: true,
            friends: connections?.contacts || []
        });
    } catch (error) {
        console.error("Error viewing friends:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve friends list",
            error: error.message
        });
    }
};

// View pending friend requests

const viewPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentUserObjectId = new mongoose.Types.ObjectId(userId);
        console.log("Current User ID:", userId);

        // Find pending requests where the current user is the sender
        const pendingFriendships = await Friend.find({
            userId: currentUserObjectId,
            status: "pending"
        });

        if (!pendingFriendships.length) {
            return res.status(200).json({
                success: true,
                pendingRequests: []
            });
        }

        console.log("Pending requests:", pendingFriendships);

        // Extract the user IDs who received the requests
        const recipientUserIds = pendingFriendships.map(request =>
            new mongoose.Types.ObjectId(request.recipientId)
        );

        console.log("Recipient User IDs:", recipientUserIds);

        // Fetch the user details of those who received requests
        const userDetails = await User.aggregate([
            {
                $match: {
                    _id: { $in: recipientUserIds }
                }
            },
            {
                $lookup: {
                    from: "friends",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$userId", "$$userId"] },
                                                { $eq: ["$recipientId", currentUserObjectId] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ["$recipientId", "$$userId"] },
                                                { $eq: ["$userId", currentUserObjectId] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "friendship"
                }
            },
            {
                $addFields: {
                    friendshipStatus: {
                        $cond: {
                            if: { $eq: [{ $size: "$friendship" }, 0] },
                            then: null,
                            else: {
                                $let: {
                                    vars: {
                                        friendDoc: { $arrayElemAt: ["$friendship", 0] }
                                    },
                                    in: {
                                        $switch: {
                                            branches: [
                                                // Condition 1: currentUser is the sender and status is pending
                                                {
                                                    case: {
                                                        $and: [
                                                            { $eq: ["$$friendDoc.userId", currentUserObjectId] },
                                                            { $eq: ["$$friendDoc.status", "pending"] }
                                                        ]
                                                    },
                                                    then: "pending"
                                                },
                                                // Condition 2: currentUser is the recipient and status is pending
                                                {
                                                    case: {
                                                        $and: [
                                                            { $eq: ["$$friendDoc.recipientId", currentUserObjectId] },
                                                            { $eq: ["$$friendDoc.status", "pending"] }
                                                        ]
                                                    },
                                                    then: "accept"
                                                }
                                            ],
                                            // Condition 4: For any other case where friendship exists
                                            default: "$$friendDoc.status"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    email: 1,
                    friendship: 1,
                    friendshipStatus: 1
                }
            }
        ]);

        console.log("Final User Details:", userDetails);

        return res.status(200).json({
            success: true,
            sentRequests: userDetails
        });
    } catch (error) {
        console.error("Error viewing sent friend requests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve sent friend requests",
            error: error.message
        });
    }
};
// Additional helper function to get both incoming and outgoing requests
const getAllFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find incoming requests (where user is recipient)
        const incomingRequests = await Friend.find({
            recipientId: userId,
            status: "pending"
        }).populate("userId", "username fullName email profilePicture");

        // Find outgoing requests (where user is sender)
        const outgoingRequests = await Friend.find({
            userId: userId,
            status: "pending"
        }).populate("recipientId", "username fullName email profilePicture");

        return res.status(200).json({
            success: true,
            incomingRequests,
            outgoingRequests
        });
    } catch (error) {
        console.error("Error retrieving friend requests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve friend requests",
            error: error.message
        });
    }
};

const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token expired or invalid'
            });
        }

        // Find the user's connection document and populate blocked users
        const userConnections = await UserConnections.findOne({ userId })
            .populate({
                path: 'blockedUsers',
                select: 'username fullName email profilePicture'
            });

        if (!userConnections) {
            return res.status(404).json({
                success: false,
                message: 'UserConnections not found'
            });
        }

        // Add status: 'blocked' to each user
        const blockedUsersWithStatus = userConnections.blockedUsers.map(user => ({
            ...user.toObject(), // Convert Mongoose document to plain JS object
            status: 'blocked'
        }));

        return res.status(200).json({
            success: true,
            message: 'Blocked users retrieved successfully',
            blockedUsers: blockedUsersWithStatus
        });

    } catch (error) {
        console.error("Error retrieving blocked users:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};



const getRecentlyAddedFriends = async(req,res,)=>{

    try {
        const userId = req.user.id;
        const days = req.body.days || 7;
        const connectionType = req.body.connectionType || 'contacts'
        if(!userId){
            return res.status(401).json({
                sucess: false,
                message: 'token expired'
            })
        }
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate()-days);
        const pipeline = [
            {$match : {userId: new mongoose.Types.ObjectId(userId)}},
            {$unwind: `$${connectionType}`},
            {
                $match:{
                    [`${connectionType}.addedAt`]: {$gte:dateThreshold}
                }
            },
            {
                $lookup:{
                    from: 'users',
                    localField: `${connectionType}.userId`,
                    foreignField: `_id`,
                    as :`userDetails`
                }
            },
            {$unwind: '$userDetails'},
            {$sort: {[`${connectionType}.addetAt`]: -1}},
            {$project:{
                
                        _id: '$userDetails._id',
                        username: '$userDetails.username',
                        email: '$userDetails.email',
                        fullName: '$userDetails.fullName',
                        profilePicture: '$userDetails.profilePicture',
                        status: 'connected'
            }}
        ]

        const recentConnections = await UserConnections.aggregate(pipeline);
        return res.status(200).json({
            sucess:true,
            data: recentConnections
        })

    }catch(e){
        console.error("error fetching recently added friends ", e.message)
        return res.status(500).json({
            sucess: false,
            message: 'Internal server error',
            error: e.message
        })
    }
}
module.exports = {
    sendFriendRequest,
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
};