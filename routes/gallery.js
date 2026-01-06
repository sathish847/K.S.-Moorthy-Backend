const express = require("express");
const Gallery = require("../models/Gallery");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

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
      .populate("author", "name email")
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
      galleryItem = await Gallery.findById(req.params.id).populate(
        "author",
        "name email"
      );
    } else {
      // Treat as slug
      galleryItem = await Gallery.findOne({ slug: req.params.id }).populate(
        "author",
        "name email"
      );
    }

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Only return active gallery items for public access
    if (galleryItem.status !== "active") {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Increment view count
    galleryItem.views += 1;
    await galleryItem.save();

    res.json(galleryItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new gallery item
// @route   POST /api/gallery
// @access  Private (Admin only)
router.post("/", protect, authorize("admin"), async (req, res) => {
  // Manual validation
  const errors = [];

  const { title, description, youtubeUrl, status, order } = req.body;

  // Validate required fields
  if (!title || title.trim() === "") {
    errors.push({
      msg: "Title is required",
      param: "title",
      location: "body",
    });
  }

  if (!description || description.trim() === "") {
    errors.push({
      msg: "Description is required",
      param: "description",
      location: "body",
    });
  }

  if (!youtubeUrl || youtubeUrl.trim() === "") {
    errors.push({
      msg: "YouTube URL or Instagram link is required",
      param: "youtubeUrl",
      location: "body",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const galleryItem = new Gallery({
      title,
      description,
      youtubeUrl,
      status: status || "active",
      order: order || 0,
      author: req.user._id,
    });

    // Generate slug before saving
    galleryItem.generateSlug();

    await galleryItem.save();

    const populatedGalleryItem = await Gallery.findById(
      galleryItem._id
    ).populate("author", "name email");

    res.status(201).json(populatedGalleryItem);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Gallery item title already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// @desc    Update a gallery item
// @route   PATCH /api/gallery/:id
// @access  Private (Admin only)
router.patch("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    const { title, description, youtubeUrl, status, order } = req.body;

    // Update fields if provided
    if (title !== undefined) galleryItem.title = title;
    if (description !== undefined) galleryItem.description = description;
    if (youtubeUrl !== undefined) galleryItem.youtubeUrl = youtubeUrl;
    if (status !== undefined) galleryItem.status = status;
    if (order !== undefined) galleryItem.order = order;
    if (order !== undefined) galleryItem.order = order;
    if (order !== undefined) galleryItem.order = order;
    if (order !== undefined) galleryItem.order = order;
    if (order !== undefined) galleryItem.order = order;

    // Regenerate slug if title was updated
    if (title !== undefined) {
      galleryItem.generateSlug();
    }

    await galleryItem.save();

    const updatedGalleryItem = await Gallery.findById(galleryItem._id).populate(
      "author",
      "name email"
    );

    res.json(updatedGalleryItem);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Gallery item title already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// Support PUT method as well for backward compatibility
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    const { title, description, youtubeUrl, status, order } = req.body;

    // Update fields if provided
    if (title !== undefined) galleryItem.title = title;
    if (description !== undefined) galleryItem.description = description;
    if (youtubeUrl !== undefined) galleryItem.youtubeUrl = youtubeUrl;
    if (status !== undefined) galleryItem.status = status;

    // Regenerate slug if title was updated
    if (title !== undefined) {
      galleryItem.generateSlug();
    }

    await galleryItem.save();

    const updatedGalleryItem = await Gallery.findById(galleryItem._id).populate(
      "author",
      "name email"
    );

    res.json(updatedGalleryItem);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Gallery item title already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// @desc    Delete a gallery item
// @route   DELETE /api/gallery/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    await Gallery.deleteOne({ _id: req.params.id });

    res.json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Publish/Unpublish a gallery item
// @route   PATCH /api/gallery/:id/publish
// @access  Private (Admin only)
router.patch("/:id/publish", protect, authorize("admin"), async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    galleryItem.isPublished = !galleryItem.isPublished;
    await galleryItem.save();

    res.json({
      message: `Gallery item ${
        galleryItem.isPublished ? "published" : "unpublished"
      } successfully`,
      isPublished: galleryItem.isPublished,
    });
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
      .populate("author", "name email")
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
