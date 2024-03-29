const Skeleton = () => {
  return (
    <div className="flex flex-col justify-end h-full">
      <div className="flex gap-4 items-center">
        <div className="flex items-end gap-4 w-full">
          <div className="skeleton h-32 w-full bg-base-100"></div>
          <div className="skeleton w-12 h-12 rounded-full shrink-0 bg-base-100"></div>
        </div>
      </div>
      <div className="flex gap-4 items-center mt-6">
        <div className="flex items-end gap-4 w-full">
          <div className="skeleton w-12 h-12 rounded-full shrink-0 bg-base-100"></div>
          <div className="skeleton h-32 w-full bg-base-100"></div>
        </div>
      </div>
      <div className="flex gap-4 items-center my-6">
        <div className="flex items-end gap-4 w-full">
          <div className="skeleton h-32 w-full bg-base-100"></div>
          <div className="skeleton w-12 h-12 rounded-full shrink-0 bg-base-100"></div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
