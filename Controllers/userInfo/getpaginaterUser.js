const mongoose = require("mongoose");
const User = require("../../models/Users/user");
const Friend = require("../../models/friendsmodels")

const getPaginatedUser = async (req, res) => {
    try {
        let { userName, page = 1, limit = 10 } = req.query;
        const currentUserId = req.user?.id;

        // Add validation for currentUserId
        if (!currentUserId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        // Convert to integers
        page = parseInt(page);
        limit = parseInt(limit);
        
        if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
            return res.status(400).json({ message: "Page and limit must be valid positive numbers." });
        }
       
        let filter = {};
       
        if (userName) {
            const regex = new RegExp(userName, "i");
            filter = {
                $or: [
                    { username: regex },
                    { name: regex },
                    { email: regex },
                    { fullName: regex }
                ]
            };
        }

        // Safely convert currentUserId to ObjectId
        let currentUserObjectId;
        try {
            currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
            // Debugging: Log the currentUserId to verify it's being converted correctly
            console.log("Current user ID for friendship lookup:", currentUserId);
        } catch (error) {
            console.error("Invalid ObjectID format for currentUserId:", error.message);
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const users = await User.aggregate([
          { 
            $match: { 
              ...filter, 
              _id: { $ne: currentUserObjectId }
            }
          },
          { $sort: { username: 1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
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
              email: 1,
              username: 1,
              fullName: 1,
              friendship: 1,
              friendshipStatus: 1
            }
          }
        ]);
        // Log a sample user to check if friendship data is present
        if (users.length > 0) {
            console.log("Sample user with friendship data:", users[0]);
        }
        
        // Remove the friendship array from the final response
        // const cleanedUsers = users.map(user => {
        //     const { friendship, ...cleanUser } = user;
        //     return cleanUser;
        // });
        
        const totalCount = await User.countDocuments(filter);

        return res.status(200).json({
            users: users,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });

    } catch (error) {
        console.error("Error in getPaginatedUser:", error);
        if (error.name === 'BSONTypeError' || error.message.includes('ObjectId')) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { getPaginatedUser };