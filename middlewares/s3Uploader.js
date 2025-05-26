const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = require('../config/awsS3')


console.log(process.env.AWS_BUCKET_NAME)

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function(req,file,cb){
            const userId = req.user.id
            const purpose = 'profilePicture'
            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = `${userId}/${purpose}/${fileName}`;
            cb(null,filePath)
        },

    }),
    limits:{fileSize: 5*1024*1024} //5 MB
})

module.exports = upload