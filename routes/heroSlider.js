const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const HeroSlider = require("../models/HeroSlider");
const { protect, authorize } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Multer for image file uploads
const uploadImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Multer for video file uploads
const uploadVideos = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

// Generic multer for any file type (legacy support)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  // No file filter - accepts any file type
});

// Multer for form data only (no file processing)
const uploadForm = multer().none();

// @desc    Upload image to Cloudinary
// @route   POST /api/hero-sliders/upload-image
// @access  Private (Admin only)
router.post(
  "/upload-image",
  protect,
  authorize("admin"),
  uploadImages.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "hero-slider-images",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      res.json({
        message: "Image uploaded successfully",
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Image upload failed" });
    }
  }
);

// @desc    Get all active hero slider items
// @route   GET /api/hero-sliders
// @access  Public
router.get("/", async (req, res) => {
  try {
    const heroSliders = await HeroSlider.find({ status: "active" })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");

    res.json(heroSliders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all hero slider items (public display endpoint)
// @route   GET /api/hero-sliders/all
// @access  Public
router.get("/all", async (req, res) => {
  try {
    const heroSliders = await HeroSlider.find()
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      count: heroSliders.length,
      data: heroSliders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get single hero slider item by ID
// @route   GET /api/hero-sliders/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const heroSlider = await HeroSlider.findById(req.params.id);

    if (!heroSlider) {
      return res.status(404).json({ message: "Hero slider item not found" });
    }

    // Only return active items for public access
    if (heroSlider.status !== "active") {
      return res.status(404).json({ message: "Hero slider item not found" });
    }

    res.json(heroSlider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new video hero slider item
// @route   POST /api/hero-sliders/video
// @access  Private (Admin only)
router.post(
  "/video",
  protect,
  authorize("admin"),
  uploadVideos.single("videoFile"),
  async (req, res) => {
    try {
      // Debug: Log request details
      console.log("=== HERO SLIDER VIDEO CREATE REQUEST ===");
      console.log("Request method:", req.method);
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("Request body:", req.body);
      console.log("File:", req.file);

      // Manual validation
      const errors = [];

      const {
        mediaType,
        title,
        subtitle,
        buttonText,
        buttonLink,
        status,
        order,
      } = req.body;

      // Validate required fields
      if (!mediaType || mediaType !== "video") {
        errors.push({
          msg: "Media type must be 'video' for this endpoint",
          param: "mediaType",
          location: "body",
        });
      }

      if (!title || title.trim() === "") {
        errors.push({
          msg: "Title is required",
          param: "title",
          location: "body",
        });
      }

      if (!subtitle || subtitle.trim() === "") {
        errors.push({
          msg: "Subtitle is required",
          param: "subtitle",
          location: "body",
        });
      }

      if (!buttonText || buttonText.trim() === "") {
        errors.push({
          msg: "Button text is required",
          param: "buttonText",
          location: "body",
        });
      }

      if (!buttonLink || buttonLink.trim() === "") {
        errors.push({
          msg: "Button link is required",
          param: "buttonLink",
          location: "body",
        });
      }

      let videoUrl = "";

      // Handle video file upload
      if (req.file) {
        try {
          const videoResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "hero-slider-videos",
                resource_type: "video",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });
          videoUrl = videoResult.secure_url;
        } catch (uploadError) {
          console.error("Video upload error:", uploadError);
          errors.push({
            msg: "Failed to upload video file",
            param: "videoFile",
            location: "files",
          });
        }
      } else {
        errors.push({
          msg: "Video file is required for video sliders",
          param: "videoFile",
          location: "files",
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const heroSlider = new HeroSlider({
        type: mediaType,
        videoUrl: videoUrl,
        desktopImage: "",
        mobileImage: "",
        title,
        subtitle,
        buttonText,
        buttonLink,
        status: status || "active",
        order: order || 0,
      });

      await heroSlider.save();

      console.log("Video hero slider created successfully:", heroSlider._id);
      res.status(201).json(heroSlider);
    } catch (error) {
      console.error("Video hero slider creation error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Create a new image hero slider item
// @route   POST /api/hero-sliders/image
// @access  Private (Admin only)
router.post(
  "/image",
  protect,
  authorize("admin"),
  uploadImages.fields([
    { name: "desktopImage", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Debug: Log request details
      console.log("=== HERO SLIDER IMAGE CREATE REQUEST ===");
      console.log("Request method:", req.method);
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("Request body:", req.body);
      console.log("Files:", req.files);

      // Manual validation
      const errors = [];

      const {
        mediaType,
        title,
        subtitle,
        buttonText,
        buttonLink,
        status,
        order,
      } = req.body;

      // Validate required fields
      if (!mediaType || mediaType !== "image") {
        errors.push({
          msg: "Media type must be 'image' for this endpoint",
          param: "mediaType",
          location: "body",
        });
      }

      if (!title || title.trim() === "") {
        errors.push({
          msg: "Title is required",
          param: "title",
          location: "body",
        });
      }

      if (!subtitle || subtitle.trim() === "") {
        errors.push({
          msg: "Subtitle is required",
          param: "subtitle",
          location: "body",
        });
      }

      if (!buttonText || buttonText.trim() === "") {
        errors.push({
          msg: "Button text is required",
          param: "buttonText",
          location: "body",
        });
      }

      if (!buttonLink || buttonLink.trim() === "") {
        errors.push({
          msg: "Button link is required",
          param: "buttonLink",
          location: "body",
        });
      }

      let desktopImageUrl = "";
      let mobileImageUrl = "";

      // Handle file uploads for image type
      if (req.files && req.files.desktopImage && req.files.desktopImage[0]) {
        try {
          const desktopResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "hero-slider-images",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.files.desktopImage[0].buffer);
          });
          desktopImageUrl = desktopResult.secure_url;
        } catch (uploadError) {
          console.error("Desktop image upload error:", uploadError);
          errors.push({
            msg: "Failed to upload desktop image",
            param: "desktopImage",
            location: "files",
          });
        }
      } else {
        errors.push({
          msg: "Desktop image file is required",
          param: "desktopImage",
          location: "files",
        });
      }

      if (req.files && req.files.mobileImage && req.files.mobileImage[0]) {
        try {
          const mobileResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "hero-slider-images",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.files.mobileImage[0].buffer);
          });
          mobileImageUrl = mobileResult.secure_url;
        } catch (uploadError) {
          console.error("Mobile image upload error:", uploadError);
          errors.push({
            msg: "Failed to upload mobile image",
            param: "mobileImage",
            location: "files",
          });
        }
      } else {
        errors.push({
          msg: "Mobile image file is required",
          param: "mobileImage",
          location: "files",
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const heroSlider = new HeroSlider({
        type: mediaType,
        videoUrl: "",
        desktopImage: desktopImageUrl,
        mobileImage: mobileImageUrl,
        title,
        subtitle,
        buttonText,
        buttonLink,
        status: status || "active",
        order: order || 0,
      });

      await heroSlider.save();

      console.log("Image hero slider created successfully:", heroSlider._id);
      res.status(201).json(heroSlider);
    } catch (error) {
      console.error("Image hero slider creation error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Create a new hero slider item (legacy - auto-detects type)
// @route   POST /api/hero-sliders
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.any(),
  async (req, res) => {
    try {
      // Debug: Log request details
      console.log("=== HERO SLIDER CREATE REQUEST ===");
      console.log("Request method:", req.method);
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("Request body:", req.body);
      console.log("Files:", req.files);
      console.log("Body keys:", req.body ? Object.keys(req.body) : "no body");

      // Manual validation
      const errors = [];

      const {
        mediaType,
        videoUrl,
        title,
        subtitle,
        buttonText,
        buttonLink,
        status,
        order,
      } = req.body;

      // Validate required fields
      if (!mediaType || !["video", "image"].includes(mediaType)) {
        errors.push({
          msg: "Media type is required and must be either 'video' or 'image'",
          param: "mediaType",
          location: "body",
        });
      }

      if (!title || title.trim() === "") {
        errors.push({
          msg: "Title is required",
          param: "title",
          location: "body",
        });
      }

      if (!subtitle || subtitle.trim() === "") {
        errors.push({
          msg: "Subtitle is required",
          param: "subtitle",
          location: "body",
        });
      }

      if (!buttonText || buttonText.trim() === "") {
        errors.push({
          msg: "Button text is required",
          param: "buttonText",
          location: "body",
        });
      }

      if (!buttonLink || buttonLink.trim() === "") {
        errors.push({
          msg: "Button link is required",
          param: "buttonLink",
          location: "body",
        });
      }

      // Validate type-specific fields
      if (mediaType === "video" && (!videoUrl || videoUrl.trim() === "")) {
        errors.push({
          msg: "Video URL is required when media type is video",
          param: "videoUrl",
          location: "body",
        });
      }

      let desktopImageUrl = "";
      let mobileImageUrl = "";

      if (mediaType === "image") {
        // Handle file uploads for image type
        const desktopImageFile = req.files.find(
          (file) => file.fieldname === "desktopImage"
        );
        const mobileImageFile = req.files.find(
          (file) => file.fieldname === "mobileImage"
        );

        if (desktopImageFile) {
          try {
            const desktopResult = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: "hero-slider-images",
                  resource_type: "image",
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              stream.end(desktopImageFile.buffer);
            });
            desktopImageUrl = desktopResult.secure_url;
          } catch (uploadError) {
            console.error("Desktop image upload error:", uploadError);
            errors.push({
              msg: "Failed to upload desktop image",
              param: "desktopImage",
              location: "files",
            });
          }
        } else {
          errors.push({
            msg: "Desktop image file is required when type is image",
            param: "desktopImage",
            location: "files",
          });
        }

        if (mobileImageFile) {
          try {
            const mobileResult = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: "hero-slider-images",
                  resource_type: "image",
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              stream.end(mobileImageFile.buffer);
            });
            mobileImageUrl = mobileResult.secure_url;
          } catch (uploadError) {
            console.error("Mobile image upload error:", uploadError);
            errors.push({
              msg: "Failed to upload mobile image",
              param: "mobileImage",
              location: "files",
            });
          }
        } else {
          errors.push({
            msg: "Mobile image file is required when type is image",
            param: "mobileImage",
            location: "files",
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const heroSlider = new HeroSlider({
        type: mediaType,
        videoUrl: videoUrl || "",
        desktopImage: desktopImageUrl,
        mobileImage: mobileImageUrl,
        title,
        subtitle,
        buttonText,
        buttonLink,
        status: status || "active",
        order: order || 0,
      });

      await heroSlider.save();

      console.log("Hero slider created successfully:", heroSlider._id);
      res.status(201).json(heroSlider);
    } catch (error) {
      console.error("Hero slider creation error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Update a video hero slider item
// @route   PATCH /api/hero-sliders/video/:id
// @access  Private (Admin only)
router.patch(
  "/video/:id",
  protect,
  authorize("admin"),
  uploadVideos.single("videoFile"),
  async (req, res) => {
    try {
      const heroSlider = await HeroSlider.findById(req.params.id);

      if (!heroSlider) {
        return res.status(404).json({ message: "Hero slider item not found" });
      }

      if (heroSlider.type !== "video") {
        return res
          .status(400)
          .json({ message: "This endpoint is only for video sliders" });
      }

      const { title, subtitle, buttonText, buttonLink, status, order } =
        req.body;

      // Update text fields if provided
      if (title !== undefined) heroSlider.title = title;
      if (subtitle !== undefined) heroSlider.subtitle = subtitle;
      if (buttonText !== undefined) heroSlider.buttonText = buttonText;
      if (buttonLink !== undefined) heroSlider.buttonLink = buttonLink;
      if (status !== undefined) heroSlider.status = status;
      if (order !== undefined) heroSlider.order = order;

      // Handle video file upload if provided
      if (req.file) {
        try {
          const videoResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "hero-slider-videos",
                resource_type: "video",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });
          heroSlider.videoUrl = videoResult.secure_url;
        } catch (uploadError) {
          console.error("Video upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "Failed to upload new video file" });
        }
      }

      await heroSlider.save();

      console.log("Video hero slider updated successfully:", heroSlider._id);
      res.json(heroSlider);
    } catch (error) {
      console.error("Video hero slider update error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Update an image hero slider item
// @route   PATCH /api/hero-sliders/image/:id
// @access  Private (Admin only)
router.patch(
  "/image/:id",
  protect,
  authorize("admin"),
  uploadImages.fields([
    { name: "desktopImage", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const heroSlider = await HeroSlider.findById(req.params.id);

      if (!heroSlider) {
        return res.status(404).json({ message: "Hero slider item not found" });
      }

      if (heroSlider.type !== "image") {
        return res
          .status(400)
          .json({ message: "This endpoint is only for image sliders" });
      }

      const { title, subtitle, buttonText, buttonLink, status, order } =
        req.body;

      // Update text fields if provided
      if (title !== undefined) heroSlider.title = title;
      if (subtitle !== undefined) heroSlider.subtitle = subtitle;
      if (buttonText !== undefined) heroSlider.buttonText = buttonText;
      if (buttonLink !== undefined) heroSlider.buttonLink = buttonLink;
      if (status !== undefined) heroSlider.status = status;
      if (order !== undefined) heroSlider.order = order;

      // Handle image file uploads if provided
      if (req.files && req.files.desktopImage && req.files.desktopImage[0]) {
        try {
          const desktopResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "hero-slider-images",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.files.desktopImage[0].buffer);
          });
          heroSlider.desktopImage = desktopResult.secure_url;
        } catch (uploadError) {
          console.error("Desktop image upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "Failed to upload new desktop image" });
        }
      }

      if (req.files && req.files.mobileImage && req.files.mobileImage[0]) {
        try {
          const mobileResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "hero-slider-images",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.files.mobileImage[0].buffer);
          });
          heroSlider.mobileImage = mobileResult.secure_url;
        } catch (uploadError) {
          console.error("Mobile image upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "Failed to upload new mobile image" });
        }
      }

      await heroSlider.save();

      console.log("Image hero slider updated successfully:", heroSlider._id);
      res.json(heroSlider);
    } catch (error) {
      console.error("Image hero slider update error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Update a hero slider item (text fields only)
// @route   PATCH /api/hero-sliders/:id
// @access  Private (Admin only)
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  uploadForm,
  async (req, res) => {
    try {
      const heroSlider = await HeroSlider.findById(req.params.id);

      if (!heroSlider) {
        return res.status(404).json({ message: "Hero slider item not found" });
      }

      const {
        type,
        videoUrl,
        desktopImage,
        mobileImage,
        title,
        subtitle,
        buttonText,
        buttonLink,
        status,
        order,
      } = req.body;

      // Update fields if provided
      if (type !== undefined) heroSlider.type = type;
      if (videoUrl !== undefined) heroSlider.videoUrl = videoUrl;
      if (desktopImage !== undefined) heroSlider.desktopImage = desktopImage;
      if (mobileImage !== undefined) heroSlider.mobileImage = mobileImage;
      if (title !== undefined) heroSlider.title = title;
      if (subtitle !== undefined) heroSlider.subtitle = subtitle;
      if (buttonText !== undefined) heroSlider.buttonText = buttonText;
      if (buttonLink !== undefined) heroSlider.buttonLink = buttonLink;
      if (status !== undefined) heroSlider.status = status;
      if (order !== undefined) heroSlider.order = order;

      await heroSlider.save();

      res.json(heroSlider);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Support PUT method as well for backward compatibility
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const heroSlider = await HeroSlider.findById(req.params.id);

    if (!heroSlider) {
      return res.status(404).json({ message: "Hero slider item not found" });
    }

    const {
      type,
      videoUrl,
      desktopImage,
      mobileImage,
      title,
      subtitle,
      buttonText,
      buttonLink,
      status,
      order,
    } = req.body;

    // Update fields if provided
    if (type !== undefined) heroSlider.type = type;
    if (videoUrl !== undefined) heroSlider.videoUrl = videoUrl;
    if (desktopImage !== undefined) heroSlider.desktopImage = desktopImage;
    if (mobileImage !== undefined) heroSlider.mobileImage = mobileImage;
    if (title !== undefined) heroSlider.title = title;
    if (subtitle !== undefined) heroSlider.subtitle = subtitle;
    if (buttonText !== undefined) heroSlider.buttonText = buttonText;
    if (buttonLink !== undefined) heroSlider.buttonLink = buttonLink;
    if (status !== undefined) heroSlider.status = status;
    if (order !== undefined) heroSlider.order = order;

    await heroSlider.save();

    res.json(heroSlider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Delete a hero slider item
// @route   DELETE /api/hero-sliders/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const heroSlider = await HeroSlider.findById(req.params.id);

    if (!heroSlider) {
      return res.status(404).json({ message: "Hero slider item not found" });
    }

    await HeroSlider.deleteOne({ _id: req.params.id });

    res.json({ message: "Hero slider item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all hero slider items (admin view - includes inactive)
// @route   GET /api/hero-sliders/admin/all
// @access  Private (Admin only)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

    const heroSliders = await HeroSlider.find()
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await HeroSlider.countDocuments();

    res.json({
      heroSliders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
