const mongoose = require("mongoose");
const Counter = require("./Counter");

const serviceSchema = new mongoose.Schema(
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
    hero_image: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    paragraphs: [
      {
        type: String,
        required: [true, "Please add at least one paragraph"],
        trim: true,
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

// Method to generate auto-incrementing ID
serviceSchema.methods.generateId = async function () {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "serviceId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.id = counter.seq;
  } catch (error) {
    throw error;
  }
};

// Index for better search performance
serviceSchema.index({ title: "text" });
serviceSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Service", serviceSchema);
