import moment from "moment";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllViolations,
  setViolationAppeal,
} from "../redux/slice/violationSlice";

const ViolationList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [violations, setViolations] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  let { isLoading, errorMessage, isError, selectedViolation } = useSelector(
    (state) => state.violation
  );
  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await dispatch(getAllViolations(userInfo?._id));
        if (response.payload.violations) {
          setViolations(response.payload.violations);
        }
        setLoading(false);
      } catch (error) {
        setError("Error fetching violations");
        setLoading(false);
      }
    };
    if (userInfo?._id) fetchViolations();
  }, [dispatch, userInfo]);

  const filteredViolations = violations.filter((violation) =>
    violation.serviceName.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleAppeal = (violationId) => {
    dispatch(setViolationAppeal({ violationId }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="border-r-2 border-base-100 pr-4 overflow-y-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <label className="input input-bordered flex items-center gap-2">
          <input
            type="text"
            className="grow"
            placeholder="Search by Service Name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
      </div>
      <div>
        {["PENDING", "APPEAL_REJECTED", "APPEALED"].map((status) => (
          <div key={status}>
            <div className="divider font-bold uppercase">
              {status.replace("_", " ")}
            </div>
            {filteredViolations
              .filter((violation) => violation.status === status)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((violation) => (
                <div key={violation._id}>
                  <button
                    className={`${
                      selectedViolation &&
                      selectedViolation?._id === violation?._id
                        ? "bg-blue-800"
                        : "bg-base-100"
                    } flex justify-between items-center p-2 pl-3 h-14 mt-1 rounded-md bg-base-100 hover:glass w-full`}
                    onClick={() =>
                      dispatch(
                        setViolationAppeal({ violationId: violation?._id })
                      )
                    }
                  >
                    <div className="ml-3 text-white font-bold uppercase">{violation.serviceName?.split("_")?.at(0)}</div>
                    <time className="text-xs opacity-50">
                      {moment(violation.createdAt).startOf("seconds").fromNow()}
                    </time>
                  </button>
                </div>
              ))}
          </div>
        ))}
        {filteredViolations.length === 0 && <p>No violations found.</p>}
      </div>
    </div>
  );
};

export default ViolationList;
