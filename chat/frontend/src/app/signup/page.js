"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import ThemeProvider from "../components/themeSelector";
import Alert from "../components/alertToast";
import {
  resetErrorState,
  setErrorMessage,
  setErrorState,
  signUpNewUser,
} from "../redux/slice/userSlice";
import "./signup.css";
import Loader from "../components/loader";

const Signup = () => {
  const [location, setLocation] = useState(null);
  const [name, setName] = useState("");
  const [username, setUserName] = useState("");
  const [password, setUserPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [randomAvatar, setRandomAvatar] = useState(true);
  const { isError, errorMessage, userAuthenticated, userInfo, isLoading } =
    useSelector((state) => state.user);
  const history = useRouter();
  const dispatch = useDispatch();

  const handleLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("position", position);
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      handleLocationPermission();
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleGenderRadioClick = (event) => {
    if (event.target.value !== gender) setGender(event.target.value);
  };

  const handleSignupClick = () => {
    if (name && username && password && gender) {
      dispatch(resetErrorState());
      dispatch(
        signUpNewUser({
          name,
          username,
          password,
          gender,
          randomAvatar,
          location,
        })
      );
    } else {
      const errorText = "Please enter all required fields";
      if (!isError) dispatch(setErrorState());
      if (errorMessage !== errorText) dispatch(setErrorMessage(errorText));
    }
  };

  useEffect(() => {
    if (userAuthenticated) {
      sessionStorage.setItem("loggedInUser", JSON.stringify(userInfo));
      history.push("/dashboard");
    }
    return () => {
      dispatch(resetErrorState());
    };
  }, [userAuthenticated]);

  return (
    <div className="flex overflow-hidden justify-center w-screen h-screen">
      <div className="flex flex-col justify-center items-center overflow-hidden signup-input-container">
        <label className="flex justify-center w-full m-3 text-xl font-semibold">
          Sign Up
        </label>
        <label className="input input-bordered flex items-center gap-2 w-11/12	m-2">
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
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2 w-11/12	m-2">
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
            onChange={(e) => setUserPassword(e.target.value)}
          />
        </label>
        <label className="flex items-center w-11/12 m-2">
          <input
            type="radio"
            name="gender"
            value="male"
            className="radio radio-primary mr-2 ml-0.5"
            checked={gender === "male"}
            onChange={handleGenderRadioClick}
          />
          <span className="label-text mr-7">Male</span>
          <input
            type="radio"
            name="gender"
            value="female"
            className="radio radio-primary mr-2"
            checked={gender === "female"}
            onChange={handleGenderRadioClick}
          />
          <span className="label-text">Female</span>
        </label>
        <label className="flex items-center w-11/12 m-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary mr-2 ml-1"
            checked={randomAvatar}
            onChange={(e) => setRandomAvatar(e.target.checked)}
          />
          <span className="label-text">Use Random Avatar</span>
        </label>
        <label className="flex items-center w-11/12 m-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary mr-2 ml-1"
            checked={location}
            // onChange={(e) => setRandomAvatar(e.target.checked)}
          />
          <span className="label-text">
            Location: {location?.latitude} | {location?.longitude}
          </span>
        </label>
        <button
          className="btn btn-primary w-11/12 mb-4 login-button mt-6"
          onClick={handleSignupClick}
        >
          Sign Up
        </button>
        <label className="w-11/12 m-2 text-sm flex font-semibold alert alert-error">
          <span className="label-text mr-1 text-black">
            By using this service, you agree to our
            <Link href="/privacy" className="btn-link text-blue-800 font-bold ml-1">
              privacy policy!
            </Link>
          </span>
        </label>
        <label className="flex w-11/12 m-2 text-sm font-semibold">
          <span className="label-text mr-1"> Already have an account?</span>
          <Link href="/login" className="btn-link">
            Login
          </Link>
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

export default Signup;
