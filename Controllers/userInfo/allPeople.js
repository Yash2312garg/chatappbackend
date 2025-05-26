const User = require("../../models/user");


const getAllPeople = async (req,res)=>{
    try{
        const users = await User.find({});
        res.status(200).json(users)
    }catch(e){
        console.log(e)
        res.status(500).json({"message":"Internal Server Error"})
    }

}


module.exports = {getAllPeople}