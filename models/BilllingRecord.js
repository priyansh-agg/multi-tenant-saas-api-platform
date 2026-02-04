import mongoose from "mongoose";

const billingRecordSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    month: {
      type: String,
      required: true // e.g. "2026-02"
    },
    totalRequests: Number,
    freeTierUsed: Number,
    billableRequests: Number,
    amount: Number,
    status: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING"
    }
  },
  {
    timestamps: true
  }
);

billingRecordSchema.index({ orgId: 1, month: 1 }, { unique: true });

export default mongoose.model("BillingRecord", billingRecordSchema);
