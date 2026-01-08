const express = require("express");
const multer = require("multer");
const Work = require("../models/Work");
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

// @desc    Upload image to Cloudinary
// @route   POST /api/works/upload-image
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
            folder: "work-images",
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

// @desc    Randomize order of all works
// @route   GET /api/works/randomize-order
// @access  Private (Admin only)
router.get(
  "/randomize-order",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      // Get all works
      const works = await Work.find();

      if (works.length === 0) {
        return res.status(404).json({ message: "No works found to randomize" });
      }

      // Create array of work IDs and shuffle them
      const workIds = works.map((work) => work._id);
      const shuffledIds = workIds.sort(() => Math.random() - 0.5);

      // Update orders starting from 41
      const updatePromises = shuffledIds.map((id, index) =>
        Work.findByIdAndUpdate(id, { order: 41 + index })
      );

      await Promise.all(updatePromises);

      res.json({
        message: `Successfully randomized order for ${works.length} works`,
        totalWorks: works.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Get all published works
// @route   GET /api/works
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

    // Add category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    const works = await Work.find(query)
      .populate("author", "name email")
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Work.countDocuments(query);

    res.json({
      works,
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

// @desc    Get single work by ID
// @route   GET /api/works/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const work = await Work.findById(req.params.id).populate(
      "author",
      "name email"
    );

    if (!work) {
      return res.status(404).json({ message: "Work not found" });
    }

    // Only return active works for public access
    if (work.status !== "active") {
      return res.status(404).json({ message: "Work not found" });
    }

    // Increment view count
    work.views += 1;
    await work.save();

    res.json(work);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new work
// @route   POST /api/works
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    // Manual validation for multipart/form-data
    const errors = [];

    const { title, category, image, status, order } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      errors.push({
        msg: "Title is required",
        param: "title",
        location: "body",
      });
    }

    if (!category || category.trim() === "") {
      errors.push({
        msg: "Category is required",
        param: "category",
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
              folder: "work-images",
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

      const work = new Work({
        title,
        category,
        image: imageUrl,
        status: status || "active",
        order: order || 0,
        author: req.user._id,
      });

      await work.save();

      const populatedWork = await Work.findById(work._id).populate(
        "author",
        "name email"
      );

      res.status(201).json(populatedWork);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Update a work
// @route   PATCH /api/works/:id
// @access  Private (Admin only)
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const work = await Work.findById(req.params.id);

      if (!work) {
        return res.status(404).json({ message: "Work not found" });
      }

      const { title, category, image, status, order } = req.body;

      // Handle image update - if new image file is uploaded, upload to Cloudinary
      let imageUrl = work.image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (work.image) {
          try {
            const publicId = work.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`work-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "work-images",
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
      if (title !== undefined) work.title = title;
      if (category !== undefined) work.category = category;
      work.image = imageUrl; // Always update image (either new upload, new URL, or existing)
      if (status !== undefined) work.status = status;
      if (order !== undefined) work.order = order;

      await work.save();

      const updatedWork = await Work.findById(work._id).populate(
        "author",
        "name email"
      );

      res.json(updatedWork);
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
      const work = await Work.findById(req.params.id);

      if (!work) {
        return res.status(404).json({ message: "Work not found" });
      }

      const { title, category, image, status, order } = req.body;

      // Handle image update - if new image file is uploaded, upload to Cloudinary
      let imageUrl = work.image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (work.image) {
          try {
            const publicId = work.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`work-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "work-images",
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
      if (title !== undefined) work.title = title;
      if (category !== undefined) work.category = category;
      work.image = imageUrl; // Always update image (either new upload, new URL, or existing)
      if (status !== undefined) work.status = status;

      await work.save();

      const updatedWork = await Work.findById(work._id).populate(
        "author",
        "name email"
      );

      res.json(updatedWork);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Delete a work
// @route   DELETE /api/works/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({ message: "Work not found" });
    }

    // Delete image from Cloudinary if exists
    if (work.image) {
      try {
        const publicId = work.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`work-images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Don't fail the work deletion if image deletion fails
      }
    }

    await Work.deleteOne({ _id: req.params.id });

    res.json({ message: "Work deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all works (admin view - includes inactive)
// @route   GET /api/works/admin/all
// @access  Private (Admin only)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

    const works = await Work.find()
      .populate("author", "name email")
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Work.countDocuments();

    res.json({
      works,
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
