import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER"],
      default: "MEMBER"
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate membership
membershipSchema.index({ userId: 1, orgId: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
