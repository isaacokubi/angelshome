const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");


const {
    getUsers,
    register,
    login,
    dashboard,
    createAnnouncement,
} = require("../controllers/adminController");
// Get all users
router.get(
    "/users",
    protect,
    admin,
    getUsers
);


// router.get("/users", protect, admin, getUsers);

// router.get("/users/:id", protect, admin, getUserById);

// router.put("/users/:id", protect, admin, updateUser);

// router.delete("/users/:id", protect, admin, deleteUser);

// router.get("/stats", protect, admin, getStats);

module.exports = router;