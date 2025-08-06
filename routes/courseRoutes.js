const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminMiddleware");
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  buyCourse,
  getMyCourses,
  getCourseLessons
} = require("../controllers/courseController");

// Public
router.get("/", getCourses);

// Admin routes (require admin authentication)
router.post("/", adminAuth, createCourse);
router.put("/:id", adminAuth, updateCourse);
router.delete("/:id", adminAuth, deleteCourse);

// Student routes (require regular authentication)
router.post("/buy/:id", auth, buyCourse);
router.get("/my", auth, getMyCourses);
router.get("/lessons/:id", auth, getCourseLessons);

module.exports = router;
