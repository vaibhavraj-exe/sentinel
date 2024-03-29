const Loader = ({ showLoader, classes }) => {
  return (
    showLoader && (
      <div className={`absolute ${classes}`}>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  );
};

export default Loader;
