import { usePathname } from "next/navigation";

import Link from "next/link";
const Logout = ({ handleLogoutClick }) => {
  const location = usePathname();
  console.log({ location });
  return (
    <div className="flex flex-col justify-center items-center gap-2 absolute left-2 bottom-6">
      <Link href={location === "/appeal" ? "/dashboard" : "/appeal"}>
        <button
          className={`btn btn-square ${
            location === "/appeal"
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
        >
          {location === "/appeal" ? "💬" : "🔨"}
        </button>
      </Link>
      <button
        className="btn btn-square  "
        onClick={handleLogoutClick}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1 1L8 1V2L2 2L2 13H8V14H1L1 1ZM10.8536 4.14645L14.1932 7.48614L10.8674 11.0891L10.1326 10.4109L12.358 8L4 8V7L12.2929 7L10.1464 4.85355L10.8536 4.14645Z"
            fill="#fff"
          />
        </svg>
      </button>
    </div>
  );
};

export default Logout;
