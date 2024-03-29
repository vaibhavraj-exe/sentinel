import mongoose from "mongoose";

const violationSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  filters: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "PENDING",
  },
  messagePayload: {
    type: Object,
    required: true,
  },
  appealMessage: {
    type: String,
  },
  appealResponse: {
    type: Object,
  },
  penalty: {  
    type: Number,
    required: true,
  },
});

const Violation = mongoose.model("Violation", violationSchema);

export default Violation;
