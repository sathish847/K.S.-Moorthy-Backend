const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const passwordResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resetToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  },
  {
    timestamps: true,
  }
);

// Hash the reset token before saving
passwordResetSchema.pre("save", async function (next) {
  if (!this.isModified("resetToken")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.resetToken = await bcrypt.hash(this.resetToken, salt);
});

// Method to check if token is valid and not expired
passwordResetSchema.methods.isValidToken = async function (token) {
  const isTokenValid = await bcrypt.compare(token, this.resetToken);
  const isNotExpired = this.expiresAt > new Date();

  return isTokenValid && isNotExpired;
};

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
