const mongoose = require("mongoose");

const heroSliderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["video", "image"],
      required: [true, "Type is required (video or image)"],
    },
    videoUrl: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          // Only validate if type is video
          if (this.type === "video") {
            return value && value.trim() !== "";
          }
          return true;
        },
        message: "Video URL is required when type is video",
      },
    },
    desktopImage: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          // Only validate if type is image
          if (this.type === "image") {
            return value && value.trim() !== "";
          }
          return true;
        },
        message: "Desktop image is required when type is image",
      },
    },
    mobileImage: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          // Only validate if type is image
          if (this.type === "image") {
            return value && value.trim() !== "";
          }
          return true;
        },
        message: "Mobile image is required when type is image",
      },
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    subtitle: {
      type: String,
      required: [true, "Subtitle is required"],
      trim: true,
      maxlength: [300, "Subtitle cannot be more than 300 characters"],
    },
    buttonText: {
      type: String,
      required: [true, "Button text is required"],
      trim: true,
      maxlength: [100, "Button text cannot be more than 100 characters"],
    },
    buttonLink: {
      type: String,
      required: [true, "Button link is required"],
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
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
heroSliderSchema.index({ status: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("HeroSlider", heroSliderSchema);
