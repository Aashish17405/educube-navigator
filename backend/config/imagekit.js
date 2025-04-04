const ImageKit = require("imagekit");
require("dotenv").config();

// Initialize ImageKit with credentials from .env
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT ||
    "https://ik.imagekit.io/yourimagekitid",
});

module.exports = imagekit;
