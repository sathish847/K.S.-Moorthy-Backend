const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    youtubeUrl: {
      type: String,
      required: [true, "Please add a YouTube URL"],
      trim: true,
      validate: {
        validator: function (v) {
          // Basic YouTube URL validation
          const youtubeRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/;
          return youtubeRegex.test(v);
        },
        message: "Please provide a valid YouTube URL",
      },
    },
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
gallerySchema.methods.generateSlug = function () {
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
gallerySchema.index({ title: "text", description: "text" });
gallerySchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model("Gallery", gallerySchema);
