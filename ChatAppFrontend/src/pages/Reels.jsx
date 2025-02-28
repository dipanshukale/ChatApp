import React from "react";
import { FaFilm } from "react-icons/fa";

const Reels = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <FaFilm className="text-6xl mb-4 text-gray-400 animate-pulse" />
      <h2 className="text-2xl font-semibold mb-2">Reels Section</h2>
      <p className="text-gray-400 text-center max-w-md">
        Exciting features are on the way! Stay tuned for an amazing reel experience.
      </p>
    </div>
  );
};

export default Reels;
