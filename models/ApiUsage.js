import mongoose from "mongoose";

const apiUsageSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true
    },
    endpoint: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number
    },
    responseTimeMs: {
      type: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model("ApiUsage", apiUsageSchema);
