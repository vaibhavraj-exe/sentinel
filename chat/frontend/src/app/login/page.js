"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../components/alertToast";

import {
  loginUser,
  resetErrorState,
  setErrorMessage,
  setErrorState,
} from "../redux/slice/userSlice";
import "./login.css";
import Link from "next/link";
import Loader from "../components/loader";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setUserPassword] = useState("");
  const { isError, errorMessage, userAuthenticated, userInfo, isLoading } =
    useSelector((state) => state.user);
  const history = useRouter();
  const dispatch = useDispatch();

  const handleLoginClick = () => {
    console.log("handleLoginClick");
    console.log({ username, password });
    if (username && password) {
      console.log("dispatching resetErrorState");
      dispatch(resetErrorState());
      dispatch(loginUser({ username, password }));
    } else {
      const errorText = "Please enter valid username and password";
      if (!isError) dispatch(setErrorState());
      if (errorMessage !== errorText) dispatch(setErrorMessage(errorText));
    }
  };

  const handleSignupClick = () => {
    dispatch(resetErrorState());
    history.push("/signup");
  };

  useEffect(() => {
    if (userAuthenticated && userInfo) {
      sessionStorage.setItem("loggedInUser", JSON.stringify(userInfo));
      history.push("/dashboard");
    }
  }, [userAuthenticated]);

  return (
    <div className="flex overflow-hidden justify-center w-screen h-screen">
      <div className="flex flex-col justify-center items-center overflow-hidden login-input-container">
        <label className="flex justify-center w-full m-3 text-xl font-semibold">
          Login
        </label>
        <label className="input input-bordered flex items-center gap-2 w-11/12 m-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 opacity-70"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            type="text"
            className="grow"
            placeholder="Username"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2 w-11/12 m-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 opacity-70"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="password"
            className="grow"
            placeholder="Password"
            value={password}
            onChange={(e) => setUserPassword(e.target.value)}
          />
        </label>
        <button
          className="btn btn-primary w-11/12 mt-6 mb-4 login-button"
          onClick={handleLoginClick}
        >
          Log In
        </button>
        <div className="divider ml-5 mr-5">Or</div>
        <button
          className="btn btn-neutral w-11/12 mt-4 login-button"
          onClick={handleSignupClick}
        >
          Sign Up
        </button>
        <label className="w-11/12 m-2 text-sm flex font-semibold mt-6 alert alert-error">
          <span className="label-text mr-1 text-black">
            By using this service, you agree to our
            <Link
              href="/privacy"
              className="btn-link text-blue-800 font-bold ml-1"
            >
              privacy policy!
            </Link>
          </span>
        </label>
      </div>
      <Alert
        isAlertVisible={isError}
        alertText={errorMessage}
        clickHandler={() => dispatch(resetErrorState())}
      />
      <Loader showLoader={isLoading} classes="top-2/4" />
    </div>
  );
};

export default Login;
