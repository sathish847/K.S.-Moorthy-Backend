const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title_en: {
      type: String,
      required: [true, "Please add an English title"],
      trim: true,
      maxlength: [200, "English title cannot be more than 200 characters"],
    },
    description_en: {
      type: String,
      required: [true, "Please add an English description"],
      trim: true,
      maxlength: [
        1000,
        "English description cannot be more than 1000 characters",
      ],
    },
    title_ta: {
      type: String,
      required: [true, "Please add a Tamil title"],
      trim: true,
      maxlength: [200, "Tamil title cannot be more than 200 characters"],
    },
    description_ta: {
      type: String,
      required: [true, "Please add a Tamil description"],
      trim: true,
      maxlength: [
        1000,
        "Tamil description cannot be more than 1000 characters",
      ],
    },
    image: {
      type: String,
      required: [true, "Please add an image"],
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
gallerySchema.index({
  title_en: "text",
  description_en: "text",
  title_ta: "text",
  description_ta: "text",
});
gallerySchema.index({ status: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("Gallery", gallerySchema);
