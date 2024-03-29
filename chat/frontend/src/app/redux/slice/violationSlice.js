import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const NEXT_PUBLIC_API_URL = "http://localhost:5000/api";

export const getAllViolations = createAsyncThunk(
  "violations/getAll",
  async (userID) => {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/violations/${userID}`,
      {
        credentials: "include",
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      }
    );
    return response.json();
  }
);

export const createViolationAppeal = createAsyncThunk(
  "violations/appeal",
  async (appealData) => {
    console.log({ appealData });
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/violations/${appealData?.violationId}/appeal`,
      {
        credentials: "include",
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(appealData),
      }
    );
    return response.json();
  }
);

const violationSlice = createSlice({
  name: "violations",
  initialState: {
    violations: [],
    isLoading: false,
    errorMessage: "",
    isError: false,
    selectedViolation: null,
  },
  reducers: {
    setViolationAppeal: (state, action) => {
      console.log({ action });
      const { violationId } = action.payload;
      const violationIndex = state.violations.findIndex(
        (violation) => violation._id === violationId
      );
      console.log({ violationIndex });
      if (violationIndex !== -1) {
        console.log({ violationIndex });
        state.selectedViolation = state.violations[violationIndex];
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getAllViolations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllViolations.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.violations) {
          state.violations = action.payload.violations;
        }
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
      })
      .addCase(getAllViolations.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(createViolationAppeal.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createViolationAppeal.fulfilled, (state, action) => {
        console.log({ action, state });
        state.isLoading = false;
        if (action.payload.isError) state.isError = true;
        if (action.payload.error) state.errorMessage = action.payload.error;
        const { unban, message, reason } = action.payload;
        if (!unban) {
          state.selectedViolation.status = "APPEAL_REJECTED";
          state.isError = true;
          state.selectedViolation.appealResponse = {
            unban: false,
            message,
            reason,
          };
          if (reason) state.errorMessage = `Appeal was not successful`;
        } else {
          state.selectedViolation.appealResponse = {
            unban: true,
            message,
            reason,
          };
          state.isError = true;
          state.selectedViolation.status = "APPEALED";
          state.errorMessage = reason || "Appeal was successful.";
        }
      })
      .addCase(createViolationAppeal.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      });
  },
});

export const { setViolationAppeal } = violationSlice.actions;

export default violationSlice.reducer;
