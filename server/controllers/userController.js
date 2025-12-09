// controllers/userController.js
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User : /api/user/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.error("registerUser error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

// Login User : /api/user/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // make sure we fetch password (if your schema has select: false for password)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found! Please register first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Logged In Successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("loginUser error:", error);
    // Only send error response if headers not already sent
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
    // otherwise pass error to next middleware (if available)
    if (typeof next === "function") return next(error);
  }
};

// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const user = await User.findById(userId).select("-password");
    return res.json({ success: true, user });
  } catch (error) {
    console.error("isAuth error:", error);
    if (!res.headersSent) return res.status(500).json({ success: false, message: error.message });
  }
};

// Logout User : /api/user/logout
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({ success: true, message: "Logged Out Successfully" });
  } catch (error) {
    console.error("logoutUser error:", error);
    if (!res.headersSent) return res.status(500).json({ success: false, message: error.message });
  }
};
