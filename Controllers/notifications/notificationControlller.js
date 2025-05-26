const notificationSchema = require("../../models/Notification")


const sendNotification = async(req,res)=>{
    try{
        const {recipientId,senderId,message,type} = req.body;

        const notification = new notificationSchema({
            recipientId,
            senderId,
            message,
            type,
        })
        await notification.save()
        res.status(201).json({messge:"notification sent",notification});
    }catch(e){
        console.log("error in sendnotification sender," , e)
        res.status(500).json({success:false,message: "error sending notification", e});
    }
}

const getUserNotification  = async(req,res)=>{
    try{
        const {userId} = req.params;
        const notification = await Notification.find({recipient:userId}).sort({createdAt:-1}).limit(20)
        res.status(200).json({success:true,data:notification});


    }catch(e){
        console.log("errror in getting all the user notification", e)
        res.status(500).json({success:false,message: "error getting notifications",e})
    }
}

// const markasRead = async (req,res)=>{
//     try{
//         const {userId} = req.body
//     }
// }

module.exports = {sendNotification,getUserNotification}