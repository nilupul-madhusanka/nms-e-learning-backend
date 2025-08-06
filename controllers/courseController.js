const Course = require("../models/Course");
const User = require("../models/User");

// Admin: Create a course
exports.createCourse = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const { title, description, price, videos } = req.body;
    const course = await Course.create({ title, description, price, videos });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Update a course
exports.updateCourse = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Public: Get all courses (no auth required)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student: Enroll in a course (buy)
exports.buyCourse = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const courseId = req.params.id;

    if (!user.purchasedCourses.includes(courseId)) {
      user.purchasedCourses.push(courseId);
      await user.save();
    }

    res.json({ message: "Enrolled in course" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student: View all enrolled courses
exports.getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("purchasedCourses");
    res.json(user.purchasedCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student: Get lessons of a specific enrolled course
exports.getCourseLessons = async (req, res) => {
  try {
    const courseId = req.params.id;
    const user = await User.findById(req.user.id);

    if (!user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({ error: "You are not enrolled in this course" });
    }

    const course = await Course.findById(courseId);
    res.json({ title: course.title, videos: course.videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
