const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Donation = require("../models/Donation");
const Contact = require("../models/Contact");
const Announcement = require("../models/Announcement");

// Get all users/admins
const getUsers = async (req, res) => {
    try {
        const users = await Admin.find().select("-password");

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Register admin
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashed = await bcrypt.hash(password, 12);

        const admin = await Admin.create({
            name,
            email,
            password: hashed,
        });

        res.json({
            message: "Admin created",
            admin,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Login admin
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found",
            });
        }

        const match = await bcrypt.compare(
            password,
            admin.password
        );

        if (!match) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Admin dashboard
const dashboard = async (req, res) => {
    try {
        const donations = await Donation.find();
        const messages = await Contact.find();

        res.json({
            totalDonations: donations.length,
            totalMessages: messages.length,
            donations,
            messages,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Create announcement
const createAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.create(req.body);

        res.json({
            message: "Announcement created",
            announcement,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getUsers,
    register,
    login,
    dashboard,
    createAnnouncement,
};