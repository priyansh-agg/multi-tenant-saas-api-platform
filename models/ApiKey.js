import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    keyHash: {
      type: String,
      required: true,
      unique: true
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    permissions: {
      type: [String],
      default: []
    },
    rateLimit: {
      type: Number,
      default: 60 // requests per minute
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("ApiKey", apiKeySchema);
