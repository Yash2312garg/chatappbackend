
const logout = (req,res) =>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:false,
            sameSite:'lax',
            path:"/"
        }).status(200).json({message: "Logged Out Succesfully"})
    }catch(e){
        console.log(e)
        res.status(500).json({message:"Internal Server Error"})
    }
}

module.exports = {logout}