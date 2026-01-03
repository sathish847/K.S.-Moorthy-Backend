const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Service = require("../models/Service");
const { protect, authorize } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Configure multer for multiple images (up to 4) - accept any field and filter in handler
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).any();

// @desc    Upload hero image to Cloudinary
// @route   POST /api/services/upload-hero-image
// @access  Private (Admin only)
router.post(
  "/upload-hero-image",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "service-hero-images",
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
        message: "Hero image uploaded successfully",
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Image upload failed" });
    }
  }
);

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/services/upload-images
// @access  Private (Admin only)
router.post(
  "/upload-images",
  protect,
  authorize("admin"),
  uploadMultiple,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No image files provided" });
      }

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "service-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);

      const imageUrls = results.map((result) => result.secure_url);
      const publicIds = results.map((result) => result.public_id);

      res.json({
        message: "Images uploaded successfully",
        imageUrls,
        publicIds,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Image upload failed" });
    }
  }
);

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { status: "active" };

    // Add search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Service.countDocuments(query);

    res.json({
      services,
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

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findOne({
      $or: [
        { id: parseInt(req.params.id) },
        {
          _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null,
        },
      ].filter(Boolean),
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Only return active services for public access
    if (service.status !== "active") {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Configure multer for service creation (hero image + multiple images)
const uploadServiceCreate = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).fields([
  { name: "hero_image", maxCount: 1 },
  { name: "images", maxCount: 4 },
]);

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadServiceCreate,
  async (req, res) => {
    // Manual validation for multipart/form-data
    const errors = [];

    const { title, hero_image, images, paragraphs, status } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      errors.push({
        msg: "Title is required",
        param: "title",
        location: "body",
      });
    }

    // Parse and validate paragraphs
    let parsedParagraphs = [];
    try {
      parsedParagraphs = JSON.parse(paragraphs);
      if (!Array.isArray(parsedParagraphs) || parsedParagraphs.length === 0) {
        errors.push({
          msg: "At least one paragraph is required",
          param: "paragraphs",
          location: "body",
        });
      } else {
        // Check each paragraph is not empty
        parsedParagraphs.forEach((paragraph, index) => {
          if (!paragraph || paragraph.trim() === "") {
            errors.push({
              msg: `Paragraph ${index + 1} cannot be empty`,
              param: `paragraphs[${index}]`,
              location: "body",
            });
          }
        });
      }
    } catch (e) {
      errors.push({
        msg: "Paragraphs must be a valid JSON array",
        param: "paragraphs",
        location: "body",
      });
    }

    // Parse and validate images
    let parsedImages = [];
    if (images) {
      try {
        parsedImages = JSON.parse(images);
        if (!Array.isArray(parsedImages)) {
          errors.push({
            msg: "Images must be a valid JSON array",
            param: "images",
            location: "body",
          });
        } else if (parsedImages.length > 4) {
          errors.push({
            msg: "Maximum 4 images allowed",
            param: "images",
            location: "body",
          });
        }
      } catch (e) {
        errors.push({
          msg: "Images must be a valid JSON array",
          param: "images",
          location: "body",
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      let heroImageUrl = hero_image || "";

      // If hero image file is uploaded, upload to Cloudinary
      if (req.files && req.files.hero_image && req.files.hero_image[0]) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "service-hero-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.files.hero_image[0].buffer);
        });
        heroImageUrl = result.secure_url;
      }

      // Handle multiple images upload
      let finalImages = parsedImages || [];
      if (req.files && req.files.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "service-images",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });
        });

        const results = await Promise.all(uploadPromises);
        const uploadedImageUrls = results.map((result) => result.secure_url);

        // Combine provided URLs with uploaded URLs
        finalImages = [...finalImages, ...uploadedImageUrls];

        // Ensure we don't exceed 4 images
        if (finalImages.length > 4) {
          finalImages = finalImages.slice(0, 4);
        }
      }

      const service = new Service({
        title,
        hero_image: heroImageUrl,
        images: finalImages,
        paragraphs: parsedParagraphs,
        status: status || "active",
      });

      // Generate ID before saving
      await service.generateId();

      await service.save();

      res.status(201).json(service);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Service title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// @desc    Update a service
// @route   PATCH /api/services/:id
// @access  Private (Admin only)
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("hero_image"),
  async (req, res) => {
    try {
      const service = await Service.findOne({
        $or: [
          { id: parseInt(req.params.id) },
          {
            _id: req.params.id.match(/^[0-9a-fA-F]{24}$/)
              ? req.params.id
              : null,
          },
        ].filter(Boolean),
      });

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const { title, hero_image, images, paragraphs, status } = req.body;

      // Handle hero image update - if new image file is uploaded, upload to Cloudinary
      let heroImageUrl = service.hero_image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (service.hero_image) {
          try {
            const publicId = service.hero_image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(
              `service-hero-images/${publicId}`
            );
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "service-hero-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        heroImageUrl = result.secure_url;
      } else if (hero_image !== undefined && hero_image !== "") {
        // If image URL is provided directly (not a file) and not empty, use it
        heroImageUrl = hero_image;
      }

      // Update fields if provided
      if (title !== undefined) service.title = title;
      if (heroImageUrl !== service.hero_image) {
        service.hero_image = heroImageUrl; // Only update hero image if it actually changed
      }
      if (images !== undefined) {
        const parsedImages = Array.isArray(images)
          ? images
          : JSON.parse(images || "[]");
        if (parsedImages.length > 4) {
          return res.status(400).json({ message: "Maximum 4 images allowed" });
        }
        service.images = parsedImages;
      }
      if (paragraphs !== undefined) {
        service.paragraphs = Array.isArray(paragraphs)
          ? paragraphs
          : JSON.parse(paragraphs);
      }
      if (status !== undefined) service.status = status;

      await service.save();

      res.json(service);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Service title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// Support PUT method as well for backward compatibility
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("hero_image"),
  async (req, res) => {
    try {
      const service = await Service.findOne({
        $or: [
          { id: parseInt(req.params.id) },
          {
            _id: req.params.id.match(/^[0-9a-fA-F]{24}$/)
              ? req.params.id
              : null,
          },
        ].filter(Boolean),
      });

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const { title, hero_image, images, paragraphs, status } = req.body;

      // Handle hero image update - if new image file is uploaded, upload to Cloudinary
      let heroImageUrl = service.hero_image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (service.hero_image) {
          try {
            const publicId = service.hero_image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(
              `service-hero-images/${publicId}`
            );
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "service-hero-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        heroImageUrl = result.secure_url;
      } else if (hero_image !== undefined && hero_image !== "") {
        // If image URL is provided directly (not a file) and not empty, use it
        heroImageUrl = hero_image;
      }

      // Update fields if provided
      if (title !== undefined) service.title = title;
      if (heroImageUrl !== service.hero_image) {
        service.hero_image = heroImageUrl; // Only update hero image if it actually changed
      }
      if (images !== undefined) {
        const parsedImages = Array.isArray(images)
          ? images
          : JSON.parse(images || "[]");
        if (parsedImages.length > 4) {
          return res.status(400).json({ message: "Maximum 4 images allowed" });
        }
        service.images = parsedImages;
      }
      if (paragraphs !== undefined) {
        service.paragraphs = Array.isArray(paragraphs)
          ? paragraphs
          : JSON.parse(paragraphs);
      }
      if (status !== undefined) service.status = status;

      await service.save();

      res.json(service);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Service title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const service = await Service.findOne({
      $or: [
        { id: parseInt(req.params.id) },
        {
          _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null,
        },
      ].filter(Boolean),
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Delete hero image from Cloudinary if exists
    if (service.hero_image) {
      try {
        const publicId = service.hero_image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`service-hero-images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Don't fail the service deletion if image deletion fails
      }
    }

    // Delete images from Cloudinary if exist
    if (service.images && service.images.length > 0) {
      const deletePromises = service.images.map(async (imageUrl) => {
        try {
          const publicId = imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`service-images/${publicId}`);
        } catch (cloudinaryError) {
          console.error("Cloudinary delete error:", cloudinaryError);
        }
      });
      await Promise.all(deletePromises);
    }

    await Service.deleteOne({ _id: service._id });

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all services (admin view - includes inactive)
// @route   GET /api/services/admin/all
// @access  Private (Admin only)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const services = await Service.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Service.countDocuments();

    res.json({
      services,
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
