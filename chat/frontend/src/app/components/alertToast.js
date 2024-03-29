import { resetErrorState as resetUserErrorState } from "../redux/slice/userSlice";
import { resetErrorState as resetMessageErrorState } from "../redux/slice/messagesSlice";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const Alert = ({ isAlertVisible, alertText, clickHandler }) => {
  const dispatch = useDispatch();
  const [timer, setTimer] = useState(null);
  console.log("isAlertVisible", isAlertVisible);

  useEffect(() => {
    let timeout;
    if (isAlertVisible) {
      timeout = setTimeout(() => {
        console.log("resetting error state");
        dispatch(resetUserErrorState());
        dispatch(resetMessageErrorState());
      }, 8000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isAlertVisible, dispatch]);

  return (
    <>
      {isAlertVisible && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-error h-10 rounded-md flex justify-center">
            <span>{alertText}</span>
            <button onClick={clickHandler}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Alert;
