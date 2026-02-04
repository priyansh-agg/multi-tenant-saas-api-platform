import mongoose from "mongoose";

const orgInviteSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ["ADMIN", "MEMBER"],
      default: "MEMBER"
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    acceptedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("OrgInvite", orgInviteSchema);