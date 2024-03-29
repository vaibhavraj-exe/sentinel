"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  logoutUser,
  resetErrorState,
  setUserAuthState,
} from "../redux/slice/userSlice";
import {
  addNewChatMessage,
  getOtherUsers,
  getUserConversation,
  resetConversation,
  setOnlineUsers,
} from "../redux/slice/messagesSlice";
import Alert from "../components/alertToast";
import Logout from "../components/logoutButton";
import Loader from "../components/loader";
import ThemeProvider from "../components/themeSelector";
import ChatSearchBox from "./chatSearchBox";
import ChatBox from "./chatBox";
import "./dashboard.css";

const Dashboard = () => {
  const [socketState, setSocket] = useState(null);
  const { userAuthenticated, isError, errorMessage, isLoading, userInfo } =
    useSelector((state) => state.user);
  console.log({
    userAuthenticated,
    isError,
    errorMessage,
    isLoading,
    userInfo,
  });
  const audioRef = useRef(null);
  const dispatch = useDispatch();
  const history = useRouter();

  const handleLogoutClick = () => {
    sessionStorage.removeItem("loggedInUser");
    dispatch(resetConversation());
    dispatch(logoutUser());
  };

  const addNewMessageOnChat = (message) => {
    if (message) dispatch(addNewChatMessage({ message }));
    audioRef.current?.play();
  };

  const getOnlineUsers = (onlineUsers) => {
    console.log("onlineUsers", onlineUsers);
    const onlineUsersList = Object.keys(onlineUsers);
    dispatch(setOnlineUsers(onlineUsersList));
  };

  const handleAuthenticatedUser = () => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      query: {
        userID: userInfo._id,
      },
    });
    socket.on("getOnlineUsers", getOnlineUsers);
    socket.on("newMessage", addNewMessageOnChat);
    setSocket(socket);
    dispatch(getOtherUsers());
    dispatch(getUserConversation());
  };

  const verifyUserAuthentication = () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (userAuthenticated) {
      handleAuthenticatedUser();
    } else if (loggedInUser?._id) {
      dispatch(setUserAuthState(loggedInUser));
    } else {
      history.push("/login");
    }
  };

  useEffect(() => {
    verifyUserAuthentication();
    return () => {
      socketState?.close();
    };
  }, [userAuthenticated]);

  return (
    <div className="flex justify-center items-center h-screen overflow-hidden">
      <div className="card card-side max-w-7xl mx-auto w-full bg-base-300 shadow-xl p-4 h-4/5">
        <ChatSearchBox />
        <ChatBox />
      </div>
      <Alert
        isAlertVisible={isError}
        alertText={errorMessage}
        clickHandler={() => dispatch(resetErrorState())}
      />
      <Logout handleLogoutClick={handleLogoutClick} />
      <Loader showLoader={isLoading} />
      <audio ref={audioRef} src="/message-recieved-sound.mp3" />
    </div>
  );
};

export default Dashboard;
