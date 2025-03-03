const cloudinary = require("cloudinary");
const fs = require("fs");
const path = require("path");
const Post = require("../models/Post");
const User = require("../models/User");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
exports.uploadImages = async (req, res) => {
  try {
    const { path } = req.body;
    let files = Object.values(req.files).flat();
    let images = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file, path);
      images.push(url);
      removeTmp(file.tempFilePath);
    }
    res.json(images);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.listImages = async (req, res) => {
  const cover_pictures = [];
  const post_images = [];
  const profile_pictures = [];
  const { path, sort, max } = req.body;

  try {
    const result = await cloudinary.v2.search
      .expression(`${path}*`)
      .sort_by("created_at", `${sort}`)
      .max_results(max)
      .execute();

    await Promise.all(
      result.resources.map(async (photo) => {
        const post = await Post.findOne({
          images: { $elemMatch: { url: photo.secure_url } },
          st: null,
          type: { $ne: "pending" },
        });

        if (post) {
          if (photo.folder === `${path}cover_pictures`) {
            cover_pictures.push(photo);
          } else if (photo.folder === `${path}post_images`) {
            post_images.push(photo);
          } else if (photo.folder === `${path}profile_pictures`) {
            profile_pictures.push(photo);
          }
        }
      })
    );

    res.json({ cover_pictures, post_images, profile_pictures, result });
  } catch (err) {
    console.log(err.error.message);
    res.status(500).json({ error: err.error.message });
  }
};

const uploadToCloudinary = async (file, path) => {
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(
      file.tempFilePath,
      {
        folder: path,
      },
      (err, res) => {
        if (err) {
          removeTmp(file.tempFilePath);
          return res.status(400).json({ message: "Upload image failed." });
        }
        resolve({
          url: res.secure_url,
        });
      }
    );
  });
};

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
