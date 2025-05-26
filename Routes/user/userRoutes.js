const express = require('express');
const {getAllPeople} = require("../../Controllers/userInfo/allPeople")
const {getProfileInfo} = require("../../Controllers/userInfo/profileInfo")
const {getPaginatedUser} = require("../../Controllers/userInfo/getpaginaterUser")
const {completeProfile} = require("../../Controllers/userInfo/completeProfile")
const {authenticateUser} = require("../../middlewares/authTokenMiddleware")
const {uploadProfilePicture} = require("../../Controllers/userInfo/uploadProfilePicture")
const { getSettings, updateSettings } = require('../../Controllers/userInfo/userSettingsController');
const { getStatus, updateStatus } = require('../../Controllers/userInfo/userStatusController');

const upload = require("../../middlewares/s3Uploader")

const router = express.Router();

// router.post("/getallpeople",getAllPeople)
// router.post("/profileInformation",getProfileInfo)
router.get("/getpaginatedusers",authenticateUser,getPaginatedUser)
router.post('/complete-profile', authenticateUser, completeProfile);
router.post("/upload-profile-picture",
    authenticateUser,
    upload.single('file'),
    uploadProfilePicture
)
router.get('/settings', authenticateUser, getSettings);
router.put('/settings', authenticateUser, updateSettings);
router.get('/status', authenticateUser, getStatus);
router.put('/status', authenticateUser, updateStatus);


module.exports =router

