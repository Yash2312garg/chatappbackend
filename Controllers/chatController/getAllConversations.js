const { default: mongoose } = require("mongoose");
const { Conversation } = require("../../models/Messaging/conversations");
const { User } = require("../../models/Users/user");


const getAllConversations = async (req, res) => {
    try {
        const userId = req.user.id
        const page = parseInt(req.query.page) || 1;
        const limit= parseInt(req.query.limit) || 10;
        const skip = (page-1)*limit;
        const unread = req.query.unread
        // Build query - find conversations where user is a participant

        const query = {
            participants: new mongoose.Types.ObjectId(userId)
        };
        // Apply optional filters
        // if(unread==='true'){
        //     // Find conversations where the user hasn't read the last message
        //     // This is a simplified approach - for more accuracy, use aggregation
        //     query.$expr= {
        //         $not:{
        //             $in:[
        //                 new mongoose.Types.ObjectId(userId),
        //                 {$ifnull:["$readBy.user",[]]}
        //             ]
        //         }
        //     }
        // }
     // Find conversations sorted by recency
        const conversations = await Conversation.find(query)
        .sort({updatedAt: -1})
        .skip(skip)
        .limit(limit)
        .populate({
            path:'participants',
            select: 'username fullName email profilePicture'
        })
        .populate({
            path:'lastMessage',
            select: 'content createdAt sender'
        })
        .populate({
            path:'readBy.user',
            select:'userName'
        })
        .populate({
            path:'readBy.user',
            select:'userName'
        });
        // Get total count for pagination
        const totalConversations = await Conversation.countDocuments(query)
        // Process each conversation to add display information
        const processedConversations = conversations.map(conversation=>{
            const conversationObj = conversation.toObject();
            // Determine conversation name for display
            // For direct messages, show the other participant's name
            if(!conversation.isGroupChat){
                const otherParticipants = conversation.participants.find(p=>p._id.toString()!==userId.toString());
                conversationObj.displayName = otherParticipants?.username || 'Unknown User';
                conversationObj.displayImage = otherParticipants?.profilePic || null

            }else{
                conversationObj.displayName = conversation.name || conversation.participants.map(p=>p.username).join(", ");

            }
            let isRead = false;

            if (conversation.readBy && conversation.readBy.length > 0) {
                isRead = conversation.readBy.some(
                    readRecord => readRecord.user && 
                        readRecord.user._id.toString() === userId.toString()
                );
            }
            conversationObj.isRead = isRead;
            
            // Check if user has muted this conversation
            const muteInfo = conversation.mutedBy?.find(
                mute => mute.user.toString() === userId.toString()
            );
            conversationObj.isMuted = !!muteInfo;
            conversationObj.muteExpiry = muteInfo?.until || null;
            
            return conversationObj;
        })
        res.status(200).json({
            success: true,
            data: {
                conversations: processedConversations,
                pagination: {
                    total: totalConversations,
                    page,
                    pages: Math.ceil(totalConversations / limit),
                    limit
                }
            }
        });
        // const page 

    } catch (e) {
        console.log(e)
        res.status(500).json({ message: "Internal Server Error", success: false, error: e.message })
    }
    // if(getAllConver)

}

// More advanced version using aggregation for accurate unread status
const getAllConversationsWithAggregation = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = mongoose.Types.ObjectId(userId);
        
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build aggregation pipeline
        const pipeline = [
            // Match conversations where the user is a participant
            { 
                $match: { 
                    participants: userObjectId 
                } 
            },
            
            // Lookup the last message details
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessage",
                    foreignField: "_id",
                    as: "lastMessageDetails"
                }
            },
            { $unwind: { path: "$lastMessageDetails", preserveNullAndEmptyArrays: true } },
            
            // Lookup participants
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participantDetails"
                }
            },
            
            // Sort by most recent first
            { $sort: { updatedAt: -1 } },
            
            // Pagination
            { $skip: skip },
            { $limit: limit },
            
            // Add computed fields
            {
                $addFields: {
                    isRead: {
                        $in: [
                            userObjectId,
                            "$readBy.user"
                        ]
                    },
                    isMuted: {
                        $gt: [
                            { 
                                $size: { 
                                    $filter: { 
                                        input: "$mutedBy", 
                                        as: "mute", 
                                        cond: { $eq: ["$$mute.user", userObjectId] } 
                                    } 
                                } 
                            },
                            0
                        ]
                    },
                    displayName: {
                        $cond: {
                            if: { $eq: ["$isGroupChat", true] },
                            then: "$name",
                            else: {
                                $let: {
                                    vars: {
                                        otherParticipant: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$participantDetails",
                                                        as: "participant",
                                                        cond: { $ne: ["$$participant._id", userObjectId] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: "$$otherParticipant.username"
                                }
                            }
                        }
                    }
                }
            },
            
            // Project only needed fields
            {
                $project: {
                    _id: 1,
                    participants: {
                        $map: {
                            input: "$participantDetails",
                            as: "participant",
                            in: {
                                _id: "$$participant._id",
                                username: "$$participant.username",
                                email: "$$participant.email",
                                profilePic: "$$participant.profilePic"
                            }
                        }
                    },
                    lastMessage: {
                        content: "$lastMessageDetails.content",
                        createdAt: "$lastMessageDetails.createdAt",
                        sender: "$lastMessageDetails.sender"
                    },
                    name: 1,
                    isGroupChat: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    isRead: 1,
                    isMuted: 1,
                    displayName: 1
                }
            }
        ];
        
        // Add filter for unread messages if requested
        if (req.query.unread === 'true') {
            pipeline.splice(1, 0, {
                $match: {
                    $expr: {
                        $not: {
                            $in: [userObjectId, "$readBy.user"]
                        }
                    }
                }
            });
        }
        
        // Execute aggregation
        const conversations = await Conversation.aggregate(pipeline);
        
        // Get total count for pagination
        const countPipeline = [...pipeline];
        countPipeline.splice(-3); // Remove skip, limit, and project
        const totalConversations = await Conversation.aggregate([
            ...countPipeline,
            { $count: "total" }
        ]);
        
        const total = totalConversations.length > 0 ? totalConversations[0].total : 0;
        
        // Return formatted response
        res.status(200).json({
            success: true,
            data: {
                conversations,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit
                }
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ 
            message: "Internal Server Error", 
            success: false, 
            error: e.message 
        });
    }
};

module.exports = {
    getAllConversations
};