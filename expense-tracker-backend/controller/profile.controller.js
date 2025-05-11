const mongoose = require("mongoose");
const User = require("../models/user.model");
const { StatusCodes } = require("http-status-codes");
const { hashPassword, comparePassword } = require("../utils/authutils");
const cloudinary = require("../config/cloudinary");
const { generateOTP, sendVerificationEmail } = require("../utils/OTPUtils");

// Update user's password
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;
  const requestedUserId = req.params.id;

  if (requestedUserId !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "You can only update your own password"
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const uploadProfilePicture = async (req, res) => {
  const userId = req.userId; // Ensure this is set correctly by your auth middleware
  const requestedUserId = req.params.id;

  if (requestedUserId !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "You can only update your own profile picture",
    });
  }

  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
      width: 300,
      crop: "scale",
    });

    // Remove old picture from Cloudinary
    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }

    // Update user document
    user.profilePicture = {
      public_id: result.public_id,
      url: result.secure_url,
    };
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update username (fullname)
const updateUsername = async (req, res) => {
  const { newUsername } = req.body;
  const userId = req.userId;
  const requestedUserId = req.params.id;

  // Validate input
  if (!newUsername || newUsername.trim().length < 2) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Username must be at least 2 characters long"
    });
  }

  // Convert both IDs to strings for consistent comparison
  if (String(requestedUserId) !== String(userId)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "You can only update your own profile"
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if new username is same as current
    if (user.fullname === newUsername.trim()) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "New username is the same as current username",
      });
    }

    // Update username
    user.fullname = newUsername.trim();
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Username updated successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  updatePassword,
  uploadProfilePicture,
  updateUsername,
}; 