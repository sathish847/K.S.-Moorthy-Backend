const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Blog = require("../models/Blog");
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
// @route   POST /api/blogs/upload-image
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
            folder: "blog-images",
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

// @desc    Get all published blogs
// @route   GET /api/blogs
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

    // Add category filter
    if (req.query.category) {
      query.category = { $in: req.query.category.split(",") };
    }

    // Add tag filter
    if (req.query.tag) {
      query.tags = { $in: req.query.tag.split(",") };
    }

    const blogs = await Blog.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
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

// @desc    Get single blog by ID or slug
// @route   GET /api/blogs/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    let blog;

    // Check if it's a valid ObjectId
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(req.params.id).populate(
        "author",
        "name email"
      );
    } else {
      // Treat as slug
      blog = await Blog.findOne({ slug: req.params.id }).populate(
        "author",
        "name email"
      );
    }

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Only return active blogs for public access
    if (blog.status !== "active") {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new blog
// @route   POST /api/blogs
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
      title,
      tags,
      image,
      shortDescription,
      paragraphs,
      category,
      mediumLink,
      mediumLinkEnabled,
      status,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      errors.push({
        msg: "Title is required",
        param: "title",
        location: "body",
      });
    }

    if (!shortDescription || shortDescription.trim() === "") {
      errors.push({
        msg: "Short description is required",
        param: "shortDescription",
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
              folder: "blog-images",
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

      const blog = new Blog({
        title,
        tags: tags ? JSON.parse(tags) : [],
        image: imageUrl,
        shortDescription,
        paragraphs: parsedParagraphs,
        category: category ? JSON.parse(category) : [],
        mediumLink: mediumLink || "",
        mediumLinkEnabled:
          mediumLinkEnabled !== undefined
            ? JSON.parse(mediumLinkEnabled)
            : true,
        status: status || "active",
        author: req.user._id,
      });

      // Generate slug before saving
      blog.generateSlug();

      await blog.save();

      const populatedBlog = await Blog.findById(blog._id).populate(
        "author",
        "name email"
      );

      res.status(201).json(populatedBlog);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Blog title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// @desc    Update a blog
// @route   PATCH /api/blogs/:id
// @access  Private (Admin only)
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      const {
        title,
        tags,
        image,
        shortDescription,
        paragraphs,
        category,
        mediumLink,
        mediumLinkEnabled,
        status,
      } = req.body;

      // Handle image update - if new image file is uploaded, upload to Cloudinary
      let imageUrl = blog.image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (blog.image) {
          try {
            const publicId = blog.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`blog-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "blog-images",
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
      if (title !== undefined) blog.title = title;
      if (tags !== undefined)
        blog.tags = Array.isArray(tags) ? tags : JSON.parse(tags || "[]");
      blog.image = imageUrl; // Always update image (either new upload, new URL, or existing)
      if (shortDescription !== undefined)
        blog.shortDescription = shortDescription;
      if (paragraphs !== undefined) {
        blog.paragraphs = Array.isArray(paragraphs)
          ? paragraphs
          : JSON.parse(paragraphs);
      }
      if (category !== undefined)
        blog.category = Array.isArray(category)
          ? category
          : JSON.parse(category || "[]");
      if (mediumLink !== undefined) blog.mediumLink = mediumLink;
      if (mediumLinkEnabled !== undefined) {
        blog.mediumLinkEnabled =
          typeof mediumLinkEnabled === "boolean"
            ? mediumLinkEnabled
            : JSON.parse(mediumLinkEnabled);
      }
      if (status !== undefined) blog.status = status;

      // Regenerate slug if title was updated
      if (title !== undefined) {
        blog.generateSlug();
      }

      await blog.save();

      const updatedBlog = await Blog.findById(blog._id).populate(
        "author",
        "name email"
      );

      res.json(updatedBlog);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Blog title already exists" });
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
  upload.single("image"),
  async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      const {
        title,
        tags,
        image,
        shortDescription,
        paragraphs,
        category,
        mediumLink,
        mediumLinkEnabled,
        status,
      } = req.body;

      // Handle image update - if new image file is uploaded, upload to Cloudinary
      let imageUrl = blog.image; // Keep existing image by default
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (blog.image) {
          try {
            const publicId = blog.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`blog-images/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Don't fail the update if image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "blog-images",
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
      if (title !== undefined) blog.title = title;
      if (tags !== undefined)
        blog.tags = Array.isArray(tags) ? tags : JSON.parse(tags || "[]");
      blog.image = imageUrl; // Always update image (either new upload, new URL, or existing)
      if (shortDescription !== undefined)
        blog.shortDescription = shortDescription;
      if (paragraphs !== undefined) {
        blog.paragraphs = Array.isArray(paragraphs)
          ? paragraphs
          : JSON.parse(paragraphs);
      }
      if (category !== undefined)
        blog.category = Array.isArray(category)
          ? category
          : JSON.parse(category || "[]");
      if (mediumLink !== undefined) blog.mediumLink = mediumLink;
      if (mediumLinkEnabled !== undefined) {
        blog.mediumLinkEnabled =
          typeof mediumLinkEnabled === "boolean"
            ? mediumLinkEnabled
            : JSON.parse(mediumLinkEnabled);
      }
      if (status !== undefined) blog.status = status;

      // Regenerate slug if title was updated
      if (title !== undefined) {
        blog.generateSlug();
      }

      await blog.save();

      const updatedBlog = await Blog.findById(blog._id).populate(
        "author",
        "name email"
      );

      res.json(updatedBlog);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Blog title already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete image from Cloudinary if exists
    if (blog.image) {
      try {
        const publicId = blog.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`blog-images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Don't fail the blog deletion if image deletion fails
      }
    }

    await Blog.deleteOne({ _id: req.params.id });

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Publish/Unpublish a blog
// @route   PATCH /api/blogs/:id/publish
// @access  Private (Admin only)
router.patch("/:id/publish", protect, authorize("admin"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    res.json({
      message: `Blog ${
        blog.isPublished ? "published" : "unpublished"
      } successfully`,
      isPublished: blog.isPublished,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all blogs (admin view - includes unpublished)
// @route   GET /api/blogs/admin/all
// @access  Private (Admin only)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Blog.countDocuments();

    res.json({
      blogs,
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
