import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import moment from "moment";
import {
  getAllMessages,
  sendNewMessage,
  suppressPiiMessage,
  resetErrorState,
} from "../redux/slice/messagesSlice";
import Skeleton from "../components/skeleton";
import Alert from "../components/alertToast";
import Loader from "../components/loader";
import ScammerWarning from "../components/warning";
import {
  getAllViolations,
  setViolationAppeal,
  createViolationAppeal,
} from "../redux/slice/violationSlice";
import { PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

const ViolationCard = ({ violation }) => {
  const [appealMessage, setAppealMessage] = useState("");
  const [isAppealLoading, setIsAppealLoading] = useState(false);
  const dispatch = useDispatch();

  const handleAppeal = async () => {
    setIsAppealLoading(true);
    await dispatch(
      createViolationAppeal({
        violationId: violation?._id,
        appealMessage,
        userId: violation.userID,
      })
    );
    setIsAppealLoading(false);
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-md overflow-hidden flex flex-col w-full ">
      <div className="px-4 py-5">
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">ID:</p>
          <p className="text-base text-gray-300 ml-2">{violation?._id}</p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">User ID:</p>
          <p className="text-base text-gray-300 ml-2">{violation?.userID}</p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">Service Name:</p>
          <p className="text-base text-gray-300 ml-2">
            {violation?.serviceName}
          </p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">Filters:</p>
          <p className="text-base text-gray-300 ml-2">
            {violation?.filters?.join(", ")}
          </p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">Status:</p>
          <p className="text-base text-gray-300 ml-2">{violation?.status}</p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">Message:</p>
          <p className="text-base text-gray-300 truncate ml-2">
            {violation?.messagePayload?.message}
          </p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-base font-bold text-white">Created At:</p>
          <p className="text-base text-gray-300 ml-2">{violation?.createdAt}</p>
        </div>
      </div>
      {violation.appealResponse ? (
        <>
          <div className="divider"></div>
          <div
            className={`m-5 p-3 rounded-md border-dashed border-2 ${
              violation.appealResponse.unban
                ? "border-green-500"
                : "border-red-500"
            }`}
          >
            <div className="flex items-center mb-2">
              <p className="text-base font-bold text-white">Appeal Status:</p>
              <p className="text-base text-gray-300 ml-2">
                {violation.appealResponse.unban ? "APPEALED" : "REJECTED"}
              </p>
            </div>
            {violation.stauts === "APPEALED" && (
              <div className="flex items-center mb-2">
                <p className="text-base font-bold text-white">
                  Credits Regained:
                </p>
                <p className="text-base text-gray-300 ml-2">
                  +{violation.appealResponse.penalty}
                </p>
              </div>
            )}
            {violation.appealResponse.reason}
          </div>
        </>
      ) : (
        <div className="flex px-4 py-4 border-t border-gray-700 gap-2">
          <Loader showLoader={isAppealLoading} />
          <input
            className="input w-full"
            placeholder="Enter your appeal message..."
            value={appealMessage}
            onChange={(e) => setAppealMessage(e.target.value)}
          />
          <button
            className="btn"
            onClick={handleAppeal}
            disabled={isAppealLoading}
          >
            {isAppealLoading ? "Sending appeal..." : "Appeal"}
          </button>
        </div>
      )}
    </div>
  );
};

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  let { violations, isLoading, errorMessage, isError, selectedViolation } =
    useSelector((state) => state.violation);

  console.log({
    violations,
    isLoading,
    errorMessage,
    isError,
    selectedViolation,
  });

  const { userInfo } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleSendMessge = () => {
    const recieverID = onGoingUserChat?._id;
    if (message)
      dispatch(sendNewMessage({ message, recieverID, selectedFile }));
  };

  const handleForceSendMessge = () => {
    console.log({ message });
    const recieverID = onGoingUserChat?._id;
    if (message)
      dispatch(
        sendNewMessage({
          message: messagePayload?.message,
          recieverID,
          selectedFile,
          force: true,
        })
      );
    dispatch(suppressPiiMessage());
  };

  let {
    onGoingUserChat,
    chats,
    isMessageSending,
    isPii,
    piiMessage,
    messagePayload,
  } = useSelector((state) => state.message);

  const prepareServiceData = (violations) => {
    const serviceCounts = violations.reduce((acc, violation) => {
      acc[violation.serviceName] = (acc[violation.serviceName] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(serviceCounts).map(([serviceName, count]) => ({
      name: serviceName,
      value: count,
    }));
  };

  const prepareStatusData = (violations) => {
    const statusCounts = violations.reduce((acc, violation) => {
      acc[violation.status] = (acc[violation.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  };

  const serviceData = prepareServiceData(violations);
  const statusData = prepareStatusData(violations);

  const serviceColors = {
    profanity_detection: "#8884d8",
    image_detection: "#82ca9d",
    link_detection: "#00aeff",
  };

  return (
    <div className="px-4 w-full">
      {selectedViolation ? (
        <div className="flex flex-col h-full">
          <div className="my-3 chat-window">
            <ViolationCard violation={selectedViolation} />
          </div>
        </div>
      ) : (
        <div className="h-full form-control justify-center items-center">
          <div className="text-2xl text-center mt-10">{`Welcome ${userInfo?.name} to the appeals section`}</div>
          <div className="mt-4 flex justify-center text-center text-sm mb-10">
            This section is used to appeal against the violations detected by
            the system.
          </div>
          <div className="flex justify-between mt-8">
            <PieChart width={400} height={400}>
              <Pie
                data={serviceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {serviceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={serviceColors[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
            <PieChart width={400} height={400}>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#82ca9d"
              >
                {serviceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={serviceColors[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
      )}
      <Alert
        isAlertVisible={isError}
        alertText={errorMessage}
        clickHandler={() => dispatch(resetErrorState())}
      />
    </div>
  );
};

export default ChatBox;
