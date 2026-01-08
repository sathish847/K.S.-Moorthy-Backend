const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Gallery = require("../models/Gallery");
const { protect, authorize } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
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

// @desc    Get all published gallery items
// @route   GET /api/gallery
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

    const query = { status: "active" };

    // Add search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const gallery = await Gallery.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Gallery.countDocuments(query);

    res.json({
      gallery,
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

// @desc    Get single gallery item by ID or slug
// @route   GET /api/gallery/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    let galleryItem;

    // Check if it's a valid ObjectId
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      galleryItem = await Gallery.findById(req.params.id);
    } else {
      // Since we removed slug field, treat as ID only
      galleryItem = await Gallery.findById(req.params.id);
    }

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Only return active gallery items for public access
    if (galleryItem.status !== "active") {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    res.json(galleryItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Upload image to Cloudinary
// @route   POST /api/gallery/upload-image
// @access  Private (Admin only)
router.post(
  "/upload-image",
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
            folder: "gallery-images",
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

// @desc    Create a new gallery item
// @route   POST /api/gallery
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    // Manual validation for multipart/form-data
    const errors = [];

    const {
      title_en,
      description_en,
      title_ta,
      description_ta,
      image,
      link,
      status,
      order,
    } = req.body;

    // Validate required fields
    if (!title_en || title_en.trim() === "") {
      errors.push({
        msg: "English title is required",
        param: "title_en",
        location: "body",
      });
    }

    if (!description_en || description_en.trim() === "") {
      errors.push({
        msg: "English description is required",
        param: "description_en",
        location: "body",
      });
    }

    if (!title_ta || title_ta.trim() === "") {
      errors.push({
        msg: "Tamil title is required",
        param: "title_ta",
        location: "body",
      });
    }

    if (!description_ta || description_ta.trim() === "") {
      errors.push({
        msg: "Tamil description is required",
        param: "description_ta",
        location: "body",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      let imageUrl = image || "";

      // If image file is uploaded, upload to Cloudinary
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "gallery-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        imageUrl = result.secure_url;
      }

      const galleryItem = new Gallery({
        title_en,
        description_en,
        title_ta,
        description_ta,
        image: imageUrl,
        link: link || "",
        status: status || "active",
        order: order || 0,
      });

      await galleryItem.save();

      res.status(201).json(galleryItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Update a gallery item
// @route   PATCH /api/gallery/:id
// @access  Private (Admin only)
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const galleryItem = await Gallery.findById(req.params.id);

      if (!galleryItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }

      const {
        title_en,
        description_en,
        title_ta,
        description_ta,
        image,
        link,
        status,
        order,
      } = req.body;

      // Handle image update - if new image file is uploaded, upload to Cloudinary
      let imageUrl = galleryItem.image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (galleryItem.image) {
          try {
            const publicId = galleryItem.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`gallery-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "gallery-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        imageUrl = result.secure_url;
      } else if (image !== undefined) {
        // If image URL is provided directly (not a file), use it
        imageUrl = image;
      }

      // Update fields if provided
      if (title_en !== undefined) galleryItem.title_en = title_en;
      if (description_en !== undefined)
        galleryItem.description_en = description_en;
      if (title_ta !== undefined) galleryItem.title_ta = title_ta;
      if (description_ta !== undefined)
        galleryItem.description_ta = description_ta;
      galleryItem.image = imageUrl; // Always update image (either new upload, new URL, or existing)
      if (link !== undefined) galleryItem.link = link;
      if (status !== undefined) galleryItem.status = status;
      if (order !== undefined) galleryItem.order = order;

      await galleryItem.save();

      res.json(galleryItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Support PUT method as well for backward compatibility
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const galleryItem = await Gallery.findById(req.params.id);

      if (!galleryItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }

      const {
        title_en,
        description_en,
        title_ta,
        description_ta,
        image,
        link,
        status,
        order,
      } = req.body;

      // Handle image update - if new image file is uploaded, upload to Cloudinary
      let imageUrl = galleryItem.image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (galleryItem.image) {
          try {
            const publicId = galleryItem.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`gallery-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "gallery-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        imageUrl = result.secure_url;
      } else if (image !== undefined) {
        // If image URL is provided directly (not a file), use it
        imageUrl = image;
      }

      // Update fields if provided
      if (title_en !== undefined) galleryItem.title_en = title_en;
      if (description_en !== undefined)
        galleryItem.description_en = description_en;
      if (title_ta !== undefined) galleryItem.title_ta = title_ta;
      if (description_ta !== undefined)
        galleryItem.description_ta = description_ta;
      galleryItem.image = imageUrl; // Always update image (either new upload, new URL, or existing)
      if (link !== undefined) galleryItem.link = link;
      if (status !== undefined) galleryItem.status = status;
      if (order !== undefined) galleryItem.order = order;

      await galleryItem.save();

      res.json(galleryItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Delete a gallery item
// @route   DELETE /api/gallery/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Delete image from Cloudinary if exists
    if (galleryItem.image) {
      try {
        const publicId = galleryItem.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`gallery-images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Don't fail the gallery deletion if image deletion fails
      }
    }

    await Gallery.deleteOne({ _id: req.params.id });

    res.json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all gallery items (admin view - includes unpublished)
// @route   GET /api/gallery/admin/all
// @access  Private (Admin only)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

    const gallery = await Gallery.find()
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Gallery.countDocuments();

    res.json({
      gallery,
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
