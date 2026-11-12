const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const configured = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(ApiError.unprocessable('Only JPEG, PNG, WebP or GIF images are allowed')),
}).single('image');

const toCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `restaurant/${folder}`, resource_type: 'image' }, (err, result) => (err ? reject(err) : resolve(result)))
      .end(buffer);
  });

// Optional image upload. JSON requests pass straight through (send `image` as a URL).
// multipart/form-data requests may include an `image` file, which is uploaded to Cloudinary
// and its URL is written to req.body.image.
const uploadImage = (folder) => (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  parser(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();
    if (!configured) return next(new ApiError(503, 'Image upload is not configured (set CLOUDINARY_* variables)'));
    try {
      const result = await toCloudinary(req.file.buffer, folder);
      req.body.image = result.secure_url;
      next();
    } catch {
      next(new ApiError(502, 'Image upload failed'));
    }
  });
};

module.exports = { uploadImage };
