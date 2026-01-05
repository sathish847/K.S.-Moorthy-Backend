const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Event = require("../models/Event");
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

// Configure multer for multiple images
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10, // Maximum 10 files
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
// @route   POST /api/events/upload-image
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
            folder: "event-images",
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

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/events/upload-images
// @access  Private (Admin only)
router.post(
  "/upload-images",
  protect,
  authorize("admin"),
  uploadMultiple.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No image files provided" });
      }

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "event-images",
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

      res.json({
        message: "Images uploaded successfully",
        imageUrls,
        publicIds: results.map((result) => result.public_id),
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Images upload failed" });
    }
  }
);

// @desc    Get all events
// @route   GET /api/events
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

    const query = {};

    // Add search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Add category filter
    if (req.query.category) {
      query.category = { $in: req.query.category.split(",") };
    }

    // Add tag filter
    if (req.query.tag) {
      query.tags = { $in: req.query.tag.split(",") };
    }

    // Add status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const events = await Event.find(query)
      .populate("author", "name email")
      .sort({ displayDate: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Event.countDocuments(query);

    res.json({
      events,
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

// @desc    Get single event by ID or slug
// @route   GET /api/events/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    let event;

    // Check if it's a valid ObjectId
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(req.params.id).populate(
        "author",
        "name email"
      );
    } else {
      // Treat as slug
      event = await Event.findOne({ slug: req.params.id }).populate(
        "author",
        "name email"
      );
    }

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Increment view count
    event.views += 1;
    await event.save();

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    // Manual validation for multipart/form-data
    const errors = [];

    const {
      title,
      tags,
      image,
      excerpt,
      paragraphs,
      displayDate,
      location,
      category,
      status,
      images,
      duration,
      knowMoreLink,
      knowMoreLinkEnabled,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      errors.push({
        msg: "Title is required",
        param: "title",
        location: "body",
      });
    }

    if (!excerpt || excerpt.trim() === "") {
      errors.push({
        msg: "Excerpt is required",
        param: "excerpt",
        location: "body",
      });
    }

    if (!displayDate) {
      errors.push({
        msg: "Display date is required",
        param: "displayDate",
        location: "body",
      });
    }

    if (!location || location.trim() === "") {
      errors.push({
        msg: "Location is required",
        param: "location",
        location: "body",
      });
    }

    // Parse and validate paragraphs
    let parsedParagraphs = [];
    try {
      parsedParagraphs = JSON.parse(paragraphs || "[]");
      if (!Array.isArray(parsedParagraphs)) {
        parsedParagraphs = [];
      }
    } catch (e) {
      errors.push({
        msg: "Paragraphs must be a valid JSON array",
        param: "paragraphs",
        location: "body",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      let imageUrl = image || "";
      let imageUrls = [];

      // Parse images field - handle both JSON array and comma-separated string
      if (images) {
        try {
          // Try to parse as JSON first
          imageUrls = JSON.parse(images);
          if (!Array.isArray(imageUrls)) {
            imageUrls = [];
          }
          // Filter out dummy/placeholder values that aren't valid URLs
          imageUrls = imageUrls.filter(
            (url) =>
              url &&
              typeof url === "string" &&
              (url.startsWith("http") || url.startsWith("https"))
          );
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          imageUrls = images
            .split(",")
            .map((url) => url.trim())
            .filter(
              (url) =>
                url && (url.startsWith("http") || url.startsWith("https"))
            );
        }
      }

      // If main image file is uploaded, upload to Cloudinary
      if (req.files.image && req.files.image[0]) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "event-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.files.image[0].buffer);
        });
        imageUrl = result.secure_url;
      }

      // If additional images are uploaded, upload them to Cloudinary
      if (req.files.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "event-images",
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
        const uploadedUrls = results.map((result) => result.secure_url);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const event = new Event({
        title,
        tags: tags ? JSON.parse(tags) : [],
        image: imageUrl,
        excerpt,
        paragraphs: parsedParagraphs,
        displayDate: new Date(displayDate),
        location,
        category: category ? JSON.parse(category) : [],
        status: status || "upcoming",
        images: imageUrls,
        duration: duration || "",
        knowMoreLink: knowMoreLink || "",
        knowMoreLinkEnabled:
          knowMoreLinkEnabled !== undefined
            ? JSON.parse(knowMoreLinkEnabled)
            : true,
        author: req.user._id,
      });

      // Generate ID and slug before saving
      await event.generateId();
      event.generateSlug();

      await event.save();

      const populatedEvent = await Event.findById(event._id).populate(
        "author",
        "name email"
      );

      res.status(201).json(populatedEvent);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Event title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// @desc    Update an event
// @route   PATCH /api/events/:id
// @access  Private (Admin only)
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const {
        title,
        tags,
        image,
        excerpt,
        paragraphs,
        displayDate,
        location,
        category,
        status,
        images,
        duration,
        knowMoreLink,
        knowMoreLinkEnabled,
      } = req.body;

      // Handle main image update
      let imageUrl = event.image;
      if (req.files.image && req.files.image[0]) {
        // Delete old image from Cloudinary if it exists
        if (event.image) {
          try {
            const publicId = event.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`event-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "event-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.files.image[0].buffer);
        });
        imageUrl = result.secure_url;
      } else if (image !== undefined) {
        imageUrl = image;
      }

      // Handle additional images update
      let imageUrls = event.images;
      if (req.files.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "event-images",
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
        const uploadedUrls = results.map((result) => result.secure_url);
        imageUrls = [...imageUrls, ...uploadedUrls];
      } else if (images !== undefined) {
        imageUrls = Array.isArray(images) ? images : JSON.parse(images || "[]");
      }

      // Update fields if provided
      if (title !== undefined) event.title = title;
      if (tags !== undefined)
        event.tags = Array.isArray(tags) ? tags : JSON.parse(tags || "[]");
      event.image = imageUrl;
      if (excerpt !== undefined) event.excerpt = excerpt;
      if (paragraphs !== undefined) {
        event.paragraphs = Array.isArray(paragraphs)
          ? paragraphs
          : JSON.parse(paragraphs || "[]");
      }
      if (displayDate !== undefined) event.displayDate = new Date(displayDate);
      if (location !== undefined) event.location = location;
      if (category !== undefined)
        event.category = Array.isArray(category)
          ? category
          : JSON.parse(category || "[]");
      if (status !== undefined) event.status = status;
      event.images = imageUrls;
      if (duration !== undefined) event.duration = duration;
      if (knowMoreLink !== undefined) event.knowMoreLink = knowMoreLink;
      if (knowMoreLinkEnabled !== undefined) {
        event.knowMoreLinkEnabled =
          typeof knowMoreLinkEnabled === "boolean"
            ? knowMoreLinkEnabled
            : JSON.parse(knowMoreLinkEnabled);
      }

      // Regenerate slug if title was updated
      if (title !== undefined) {
        event.generateSlug();
      }

      await event.save();

      const updatedEvent = await Event.findById(event._id).populate(
        "author",
        "name email"
      );

      res.json(updatedEvent);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Event title already exists" });
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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const {
        title,
        tags,
        image,
        excerpt,
        paragraphs,
        displayDate,
        location,
        category,
        status,
        images,
        duration,
        knowMoreLink,
        knowMoreLinkEnabled,
      } = req.body;

      // Handle main image update
      let imageUrl = event.image;
      if (req.files.image && req.files.image[0]) {
        // Delete old image from Cloudinary if it exists
        if (event.image) {
          try {
            const publicId = event.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`event-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "event-images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.files.image[0].buffer);
        });
        imageUrl = result.secure_url;
      } else if (image !== undefined) {
        imageUrl = image;
      }

      // Handle additional images update
      let imageUrls = event.images;
      if (req.files.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "event-images",
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
        const uploadedUrls = results.map((result) => result.secure_url);
        imageUrls = [...imageUrls, ...uploadedUrls];
      } else if (images !== undefined) {
        imageUrls = Array.isArray(images) ? images : JSON.parse(images || "[]");
      }

      // Update fields if provided
      if (title !== undefined) event.title = title;
      if (tags !== undefined)
        event.tags = Array.isArray(tags) ? tags : JSON.parse(tags || "[]");
      event.image = imageUrl;
      if (excerpt !== undefined) event.excerpt = excerpt;
      if (paragraphs !== undefined) {
        event.paragraphs = Array.isArray(paragraphs)
          ? paragraphs
          : JSON.parse(paragraphs || "[]");
      }
      if (displayDate !== undefined) event.displayDate = new Date(displayDate);
      if (location !== undefined) event.location = location;
      if (category !== undefined)
        event.category = Array.isArray(category)
          ? category
          : JSON.parse(category || "[]");
      if (status !== undefined) event.status = status;
      event.images = imageUrls;
      if (duration !== undefined) event.duration = duration;
      if (knowMoreLink !== undefined) event.knowMoreLink = knowMoreLink;
      if (knowMoreLinkEnabled !== undefined) {
        event.knowMoreLinkEnabled =
          typeof knowMoreLinkEnabled === "boolean"
            ? knowMoreLinkEnabled
            : JSON.parse(knowMoreLinkEnabled);
      }

      // Regenerate slug if title was updated
      if (title !== undefined) {
        event.generateSlug();
      }

      await event.save();

      const updatedEvent = await Event.findById(event._id).populate(
        "author",
        "name email"
      );

      res.json(updatedEvent);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Event title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete main image from Cloudinary if exists
    if (event.image) {
      try {
        const publicId = event.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`event-images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }
    }

    // Delete additional images from Cloudinary if exist
    if (event.images && event.images.length > 0) {
      const deletePromises = event.images.map((imageUrl) => {
        try {
          const publicId = imageUrl.split("/").pop().split(".")[0];
          return cloudinary.uploader.destroy(`event-images/${publicId}`);
        } catch (cloudinaryError) {
          console.error("Cloudinary delete error:", cloudinaryError);
          return Promise.resolve(); // Don't fail if image deletion fails
        }
      });
      await Promise.all(deletePromises);
    }

    await Event.deleteOne({ _id: req.params.id });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all events (admin view)
// @route   GET /api/events/admin/all
// @access  Private (Admin only)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

    const events = await Event.find()
      .populate("author", "name email")
      .sort({ displayDate: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Event.countDocuments();

    res.json({
      events,
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
