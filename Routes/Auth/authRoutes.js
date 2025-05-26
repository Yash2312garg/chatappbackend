const express = require('express');
// const {login} = require("../../Controllers/authController/login")
// const {register} =  require("../../Controllers/authController/register")
const {register} =  require("../../Controllers/authController/register_new")
const {login} = require("../../Controllers/authController/login_new")
// const {logout} =  require("../../Controllers/authController/logout")


const router = express.Router();


router.post('/login',login);
router.post('/register',register);
// router.post('/logout',logout);


module.exports =router
