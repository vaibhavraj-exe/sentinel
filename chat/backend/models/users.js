import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    username: {
      type: String,
      require: true,
    },
    gender: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    profilepic: {
      type: String,
      require: true,
    },
    location: {
      type: Object,
      require: false,
    },
    credits: {
      type: Number,
      require: false,
      default: 1,
    },
    appeals: {
      type: Array,
      require: false,
      default: [],
    },
    verified: {
      type: Boolean,
      require: false,
      default: false,
    },
  },
  { timestamps: true }
);

const Users = mongoose.model("Users", UserSchema);

export default Users;
