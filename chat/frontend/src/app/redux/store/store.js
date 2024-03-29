import messagesSlice from "../slice/messagesSlice";
import userSlice from "../slice/userSlice";
import violationSlice from "../slice/violationSlice";

const { configureStore } = require("@reduxjs/toolkit");

const store = configureStore({
  reducer: {
    user: userSlice,
    message: messagesSlice,
    violation: violationSlice
  },
});

export default store;
