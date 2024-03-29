import { useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { setNewChat, setNewConversation } from "../redux/slice/messagesSlice";
import { setErrorMessage, setErrorState } from "../redux/slice/userSlice";

const ChatSearchBox = () => {
  const [searchError, setSearchError] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const {
    userFriendsList,
    onGoingUserChat,
    onlineUsersList,
    unreadMessages,
    allUsers,
  } = useSelector((state) => state.message);
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.user);
  console.log({ userInfo });

  const handleTextErrorState = () => {
    if (searchError) setSearchError(false);
    handleSearchedUserClick();
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value.toLowerCase();
    setUserSearchInput(inputValue);
    if (allUsers.length) {
      const newUsers = [];
      if (inputValue) {
        for (let item of allUsers) {
          if (item.name.toLowerCase().includes(inputValue)) {
            newUsers.push(item);
          }
        }
      }
      let remainingUsers = [];
      if (newUsers.length) {
        newUsers.forEach((item) => {
          const isFriend = userFriendsList.some((i) => i._id === item._id);
          if (!isFriend) {
            remainingUsers.push(item);
          }
        });
      }
      setSearchError(!remainingUsers.length);
      setSearchedUsers([...remainingUsers]);
    } else {
      dispatch(setErrorState());
      dispatch(
        setErrorMessage(
          "Not able to find any user at this moment, Please try again after some time"
        )
      );
    }
  };

  const handleSearchedUserClick = (selectedUser) => {
    setSearchedUsers([]);
    setUserSearchInput("");
    if (selectedUser) dispatch(setNewConversation(selectedUser));
  };

  return (
    <div
      className="border-r-2 border-[#202020] pr-4"
      onClick={handleTextErrorState}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <label className="form-control">
            <div className="label">
              {searchError && (
                <span className="label-text-alt text-red-400">
                  User not found
                </span>
              )}
            </div>
            <label className="input input-bordered flex items-center gap-2 border-b-2 border-[#3d3d3d] join-item bg-[#3d3d3d]"
            style={{ outline: "none" }}>
              <input
                type="text"
                className="grow"
                placeholder="Search Your Friends"
                value={userSearchInput}
                onChange={handleInputChange}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-4 h-4 opacity-70"
                viewBox="0 0 50 50"
              >
                <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
              </svg>
            </label>
          </label>
          <div className="flex flex-col mt-4 rounded-md cursor-pointer overflow-hidden overflow-y-scroll no-scrollbar">
            <div className="flex flex-col bg-gray-200 rounded-md cursor-pointer dark:bg-gray-800">
              {searchedUsers.map((item, index) => {
                return (
                  <div
                    className="flex items-center p-2 h-12 bg-[#f5f5f58a] rounded-lg"
                    key={index}
                    onClick={() => handleSearchedUserClick(item)}
                  >
                    <div className="avatar">
                      <div className="w-8 rounded-full">
                        <Image
                          src={item.profilepic}
                          alt="profile pic"
                          width={100}
                          height={100}
                        />
                      </div>
                    </div>
                    <div className="ml-3 text-black"> {item.name}</div>
                  </div>
                );
              })}
            </div>
            {userFriendsList.map((item, index) => {
              return (
                <div
                  className={`${
                    onGoingUserChat && onGoingUserChat?._id === item?._id
                      ? "bg-[#454545] hover:bg-[#515151]"
                      : "bg-[#2c2c2c] hover:bg-[#383838]"
                  }
                        flex justify-between items-center p-2 pl-3 h-14 mt-1 rounded-md bg-base-100 hover:glass text-slate-50`}
                  key={index}
                  onClick={() => dispatch(setNewChat(item))}
                >
                  <div className="flex justify-start items-center">
                    <div
                      className={
                        onlineUsersList.includes(item._id)
                          ? "avatar online"
                          : "avatar"
                      }
                    >
                      <div className="w-8 rounded-full">
                        <Image
                          src={item.profilepic}
                          alt="profile pic"
                          width={100}
                          height={100}
                        />
                      </div>
                    </div>
                    <div className="ml-3">{item.name}</div>
                  </div>
                  {unreadMessages.includes(item._id) && (
                    <div className="indicator-item badge badge-accent">
                      {
                        unreadMessages.filter((userId) => userId === item._id)
                          .length
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex rounded-md items-center p-4 h-16 bg-slate-600 justify-between">
          <div className="flex items-center">
            <div className="avatar online">
              <div className="w-10 rounded-full">
                <img src={userInfo?.profilepic} />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="ml-3 text-white font-bold text-lg">
                {userInfo?.name}
              </div>
              <div className="ml-3 text-white font-bold text-sm">
                {userInfo?._id.slice(0, 9)}...
              </div>
            </div>
          </div>
          <div className="w-8 rounded-full justify-end items-end">⚙️</div>
        </div>
      </div>
    </div>
  );
};

export default ChatSearchBox;
