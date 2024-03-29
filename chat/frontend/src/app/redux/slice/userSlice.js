const { createSlice, createAsyncThunk } = require("@reduxjs/toolkit");

const NEXT_PUBLIC_API_URL = "http://localhost:5000/api";

export const signUpNewUser = createAsyncThunk(
  "auth/signup",
  async ({ name, username, password, gender, randomAvatar, location }) => {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        ["content-type"]: "application/json",
      },
      body: JSON.stringify({
        name,
        username,
        password,
        gender,
        randomAvatar,
        location,
      }),
    });
    return response.json();
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ username, password }) => {
    console.log("user slice login thunk");
    console.log({ username, password, url: process.env.NEXT_PUBLIC_API_URL });
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        ["content-type"]: "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    console.log({ response });
    const res = await response.json();
    console.log({ res });
    return res;
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/logout`, {
    method: "GET",
    credentials: "include",
    headers: {
      ["content-type"]: "application/json",
    },
  });
  return response.json();
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    userAuthenticated: false,
    userInfo: null,
    isLoading: false,
    isError: false,
    errorMessage: "",
  },
  reducers: {
    resetErrorState: (state) => {
      state.isError = false;
      state.errorMessage = "";
    },
    setErrorState: (state) => {
      state.isError = true;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    setUserAuthState: (state, action) => {
      state.userAuthenticated = true;
      state.userInfo = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.user) {
          state.userInfo = action.payload.user;
          state.userAuthenticated = true;
        }
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(signUpNewUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signUpNewUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        if (action.payload.user) {
          state.userInfo = action.payload.user;
          state.userAuthenticated = true;
        }
      })
      .addCase(signUpNewUser.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.userAuthenticated = false;
        state.userInfo = null;
        state.isLoading = false;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const {
  resetErrorState,
  setErrorState,
  setErrorMessage,
  setUserAuthState,
} = userSlice.actions;

export default userSlice.reducer;
