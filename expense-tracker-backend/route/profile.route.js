const express = require("express");
const {
    updatePassword,
    uploadProfilePicture,
    updateUsername,
} = require("../controller/profile.controller");
const uploadMiddleware = require("../middlewares/fileUpload.middleware");
const authenticateUser = require("../middlewares/auth.middleware");

const router = express.Router();

// Update username endpoint
router.patch(
    "/update-username/:id",
    authenticateUser,
    updateUsername
);

// Update password endpoint
router.patch(
    "/update-password/:id",
    authenticateUser,
    updatePassword
);

// Upload profile picture endpoint
router.post(
    "/upload-picture/:id",
    authenticateUser,
    uploadMiddleware,
    uploadProfilePicture
);

module.exports = router;
