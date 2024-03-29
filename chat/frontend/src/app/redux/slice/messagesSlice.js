import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const NEXT_PUBLIC_API_URL = "http://localhost:5000/api";

export const sendNewMessage = createAsyncThunk(
  "chat/send",
  async ({ message, recieverID, selectedFile, force }) => {
    console.log({ message, recieverID, selectedFile });

    const formData = new FormData();
    formData.append("message", message);
    formData.append("receiverID", recieverID);
    formData.append("file", selectedFile);
    if (force) formData.append("force", force);

    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/message/send/${recieverID}`,
      {
        credentials: "include",
        method: "POST",
        body: formData,
      }
    );

    return response.json();
  }
);

export const getAllMessages = createAsyncThunk(
  "chat/get",
  async ({ recieverID }) => {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/message/${recieverID}`,
      {
        credentials: "include",
        method: "GET",
        headers: {
          ["content-type"]: "application/json",
        },
      }
    );
    return response.json();
  }
);

export const videoCall = createAsyncThunk("chat/call", async () => {
  console.log("videoCall");
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/message/call`, {
    credentials: "include",
    method: "POST",
    headers: {
      ["content-type"]: "application/json",
    },
  });
  return response.json();
});

export const getOtherUsers = createAsyncThunk("chat/user", async () => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/users`, {
    credentials: "include",
    method: "GET",
    headers: {
      ["content-type"]: "application/json",
    },
  });
  return response.json();
});

export const getUserConversation = createAsyncThunk(
  "chat/conversation",
  async () => {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/conversation/`, {
      credentials: "include",
      method: "GET",
      headers: {
        ["content-type"]: "application/json",
      },
    });
    return response.json();
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    userFriendsList: [],
    onGoingUserChat: null,
    isLoading: false,
    isMessageSending: false,
    errorMessage: "",
    isError: false,
    chats: [],
    onlineUsersList: [],
    unreadMessages: [],
    allUsers: [],
    isPii: false,
    piiMessage: [],
    messagePayload: {},
    callPayload: {},
  },
  reducers: {
    setNewConversation: (state, action) => {
      state.userFriendsList.unshift(action.payload);
    },
    setNewChat: (state, action) => {
      state.onGoingUserChat = action.payload;
      if (state.unreadMessages.length) {
        const newUnreadMessages = state.unreadMessages.filter(
          (item) => item !== action.payload._id
        );
        state.unreadMessages = newUnreadMessages;
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsersList = action.payload;
    },
    addNewChatMessage: (state, action) => {
      const {
        message: { senderID },
      } = action.payload;
      console.log({ senderID, state });
      if (senderID === state.onGoingUserChat?._id)
        state.chats.push(action.payload.message);
      else {
        const isUserFriend = state.userFriendsList.some(
          (item) => item._id === senderID
        );
        if (isUserFriend) {
          state.unreadMessages.push(senderID);
        } else {
          const newFriend = state.allUsers.find(
            (item) => item._id === senderID
          );
          state.userFriendsList.unshift(newFriend);
          state.unreadMessages.push(senderID);
        }
      }
    },
    resetConversation: (state) => {
      state.userFriendsList = [];
      state.onGoingUserChat = null;
      state.isLoading = false;
      state.errorMessage = "";
      state.isError = false;
      state.chats = [];
      state.onlineUsersList = [];
      state.unreadMessages = [];
      state.allUsers = [];
    },
    suppressPiiMessage: (state) => {
      console.log("state", state);
      state.isPii = false;
      state.piiMessage = [];
      state.messagePayload = {};
    },
    resetErrorState: (state) => {
      state.isError = false;
      state.errorMessage = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getOtherUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOtherUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.users) {
          state.allUsers = [...action.payload.users];
        }
      })
      .addCase(getOtherUsers.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(sendNewMessage.pending, (state) => {
        state.isMessageSending = true;
      })
      .addCase(sendNewMessage.fulfilled, (state, action) => {
        console.log("action.payload", { state, action });
        state.isMessageSending = false;
        if (action.payload.isPii) {
          state.isPii = true;
          state.piiMessage = action.payload.piiMessage;
          state.messagePayload = action.payload.messagePayload;
        }
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.newMessasge) {
          state.chats.push(action.payload.newMessasge);
        }
      })
      .addCase(sendNewMessage.rejected, (state) => {
        state.isMessageSending = false;
        state.isError = true;
      })
      .addCase(getAllMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.allMessages) {
          state.chats = action.payload.allMessages;
        }
      })
      .addCase(getAllMessages.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getUserConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.userConversations) {
          state.userFriendsList = action.payload.userConversations;
        }
      })
      .addCase(getUserConversation.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(videoCall.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(videoCall.fulfilled, (state, action) => {
        console.log("action.payload", { state, action });
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.data) {
          state.isError = true;
          state.errorMessage = "Explicit content detected!";
          // state.errorMessage = action.payload.data
          //   .map((entry) => entry.class)
          //   .join(", ");
          state.callPayload = action.payload.data;
        }
      });
  },
});

export const {
  setNewConversation,
  setNewChat,
  setOnlineUsers,
  resetConversation,
  addNewChatMessage,
  suppressPiiMessage,
  resetErrorState,
} = messageSlice.actions;

export default messageSlice.reducer;
