const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    image: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      required: [true, "Please add a short description"],
      trim: true,
      maxlength: [500, "Short description cannot be more than 500 characters"],
    },
    paragraphs: [
      {
        type: String,
        required: [true, "Please add at least one paragraph"],
        trim: true,
      },
    ],
    category: [
      {
        type: String,
        trim: true,
      },
    ],
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mediumLink: {
      type: String,
      default: "",
      trim: true,
    },
    mediumLinkEnabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Method to generate slug from title
blogSchema.methods.generateSlug = function () {
  if (this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
};

// Index for better search performance
blogSchema.index({ title: "text", shortDescription: "text", tags: "text" });
blogSchema.index({ category: 1 });
blogSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
