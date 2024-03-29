import React from "react";

const ScammerWarning = () => {
  return (
    <div className="bg-yellow-500 p-4 rounded-md m-3">
      <h2 className="text-lg font-bold mb-2 text-red-700">
        Beware of interacting with this user
      </h2>
      <p className="text-black">
        Please be cautious when interacting with this user. They have been
        flagged by our systems for suspicious activity. Only proceed if you
        trust this user and refrain from sharing any personal information with
        them.
      </p>
    </div>
  );
};

export default ScammerWarning;
