require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await Admin.findOne({
            email: "admin@example.com",
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@123",
            10
        );

        const admin = await Admin.create({
            name: "Administrator",
            email: "admin@example.com",
            password: hashedPassword,
            role: "admin",
        });

        console.log("Admin created successfully");
        console.log(admin);

        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();