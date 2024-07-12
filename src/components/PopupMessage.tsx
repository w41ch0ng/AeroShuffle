import React from "react";

interface PopupMessageProps {
  message: string;
  isVisible: boolean;
}

const PopupMessage: React.FC<PopupMessageProps> = ({ message, isVisible }) => {
  return (
    <div
      className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
};

export default PopupMessage;
