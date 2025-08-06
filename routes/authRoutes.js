const express = require("express");
const router = express.Router();
const { register, login, getAdminStats, getAllStudents, deleteStudent, updateStudent } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminMiddleware");

router.post("/register", register);
router.post("/login", login);

// Protected admin routes
router.get("/admin/stats", adminAuth, getAdminStats);
router.get("/admin/students", adminAuth, getAllStudents);
router.delete("/admin/students/:id", adminAuth, deleteStudent);
router.put("/admin/students/:id", adminAuth, updateStudent);

module.exports = router;
