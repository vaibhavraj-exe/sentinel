import messagesSlice from "../slice/messagesSlice";
import userSlice from "../slice/userSlice";

const { configureStore } = require("@reduxjs/toolkit");

const store = configureStore({
  reducer: {
    user: userSlice,
    message: messagesSlice,
  },
});

export default store;
