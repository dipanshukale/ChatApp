import React from "react";
import { FaRegImages } from "react-icons/fa";

const Posts = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
      <FaRegImages className="text-6xl mb-4 text-gray-400 animate-pulse" />
      <h2 className="text-2xl font-semibold mb-2">Posts Section</h2>
      <p className="text-gray-400 text-center max-w-md">
        The posts feature is under development! Stay tuned for an exciting update.
      </p>
    </div>
  );
};

export default Posts;
