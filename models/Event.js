const mongoose = require("mongoose");
const Counter = require("./Counter");

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
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
    excerpt: {
      type: String,
      required: [true, "Please add an excerpt"],
      trim: true,
      maxlength: [500, "Excerpt cannot be more than 500 characters"],
    },
    paragraphs: [
      {
        type: String,
        trim: true,
      },
    ],
    displayDate: {
      type: Date,
      required: [true, "Please add a display date"],
    },
    location: {
      type: String,
      required: [true, "Please add a location"],
      trim: true,
    },
    category: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "completed"],
      default: "upcoming",
    },
    images: [
      {
        type: String,
        default: "",
      },
    ],
    duration: {
      type: String,
      trim: true,
    },
    knowMoreLink: {
      type: String,
      default: "",
      trim: true,
    },
    knowMoreLinkEnabled: {
      type: Boolean,
      default: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
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
  },
  {
    timestamps: true,
  }
);

// Method to generate slug from title
eventSchema.methods.generateSlug = function () {
  if (this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
};

// Method to generate auto-incrementing ID
eventSchema.methods.generateId = async function () {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "eventId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.id = counter.seq;
  } catch (error) {
    throw error;
  }
};

// Index for better search performance
eventSchema.index({ title: "text", excerpt: "text", tags: "text" });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1, displayDate: -1 });

module.exports = mongoose.model("Event", eventSchema);
