// routes/contact.js
const express = require('express');
const nodemailer = require('nodemailer');
const contactUs = require('../models/contactUs');
const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    // Create a new contact entry
    const newContact = new contactUs({ name, email, message });

    try {
        // Save the contact entry to MongoDB
        await newContact.save();

        
        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or another email service provider
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Setup email data
        const mailOptions = {
            from: email, // sender address
            to: process.env.EMAIL_USER, // list of receivers
            subject: `New contact form submission from ${name}`, // Subject line
            text: message, // plain text body
            html: `<p>You have a new contact form submission:</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message}</p>`, // HTML body
        };

        // Send mail
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
});

module.exports = router;
