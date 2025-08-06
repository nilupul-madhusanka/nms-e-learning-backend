const User = require("../models/User");
const Course = require("../models/Course");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if trying to register an admin and if one already exists
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.status(403).json({ error: "An admin is already registered" });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    const message = user.role === "student" ? "Student logged successfully" :
            user.role === "admin" ? "Admin Logged successfully" : "";
    res.json({ token, message, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    // Count total students (users with role 'student')
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Get all courses to calculate total revenue
    const courses = await Course.find();
    
    // Calculate total revenue by summing up all course prices multiplied by enrolled students
    let totalRevenue = 0;
    for (const course of courses) {
      const enrolledStudents = await User.countDocuments({ 
        purchasedCourses: course._id 
      });
      totalRevenue += course.price * enrolledStudents;
    }
    
    // Get total enrollment count
    const totalEnrollments = await User.aggregate([
      { $match: { role: 'student' } },
      { $project: { enrollmentCount: { $size: '$purchasedCourses' } } },
      { $group: { _id: null, total: { $sum: '$enrollmentCount' } } }
    ]);
    
    res.json({
      totalStudents,
      totalRevenue: totalRevenue.toFixed(2),
      totalEnrollments: totalEnrollments[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('purchasedCourses', 'title price')
      .select('-password')
      .sort({ name: 1 });
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists and is a student
    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await User.findByIdAndDelete(id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student (e.g., reset password, update info)
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, resetPassword } = req.body;
    
    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // If admin wants to reset password, generate a new temporary password
    if (resetPassword) {
      const tempPassword = 'temp123456'; // In production, you'd generate a random password
      updateData.password = await bcrypt.hash(tempPassword, 10);
    }
    
    const updatedStudent = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    ).select('-password');
    
    res.json({ 
      student: updatedStudent, 
      message: resetPassword ? 'Student updated and password reset to: temp123456' : 'Student updated successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
