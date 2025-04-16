const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

const uploadImage = async (filePath, userId) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `kumustaka/forum/user_${userId}`,
      use_filename: true,
      unique_filename: false,
      overwrite: false,
      resource_type: "auto",
      quality: "auto:good",
    });

    console.log("Upload successful:", result.public_id);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

module.exports = {
  uploadImage,
};
