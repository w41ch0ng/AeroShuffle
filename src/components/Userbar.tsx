import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import backButton from "../assets/images/sprites/back-button.png";
import forwardButton from "../assets/images/sprites/forward-button.png";

interface UserbarProps {
  image: string;
  username: string;
  handleLogout: () => void;
  sidebarOpen: boolean | null;
  setSidebarOpen: (open: boolean | null) => void;
}

export default function Userbar({
  image,
  username,
  handleLogout,
  sidebarOpen,
  setSidebarOpen,
}: UserbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Initialise history stack with current location path when the component mounts
    setHistoryStack([location.pathname]);
  }, []);

  useEffect(() => {
    // Update history stack when location changes
    setHistoryStack((prevStack) => [...prevStack, location.pathname]);
  }, [location.pathname]);

  const goBack = () => {
    if (historyStack.length > 1) {
      // Remove the current page from history stack
      const updatedStack = historyStack.slice(0, -1);
      setHistoryStack(updatedStack);
      // Check if the current location is the initial entry point
      const initialPage = historyStack[0];
      if (location.pathname === initialPage) {
        // If the current location is the initial entry point, do nothing
        return;
      }
      // Navigate to the previous page
      window.history.back();
    }
  };

  const goForward = () => {
    window.history.forward(); // Go forward a page based on window history
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen); // Toggle sidebar
  };

  return (
    <div className="relative h-6 mx-4 my-2.5 flex justify-between items-center">
      <div className="space-x-1 flex w-20 h-6 items-center">
        <i
          className="fa-solid fa-bars hover:cursor-pointer text-white text-lg md:hidden"
          onClick={toggleSidebar}
        ></i>
        <img
          src={backButton}
          alt="back"
          className="hover:brightness-125 cursor-pointer"
          onClick={goBack}
        />
        <img
          src={forwardButton}
          alt="forward"
          className="hover:brightness-125 cursor-pointer"
          onClick={goForward}
        />
      </div>
      <div className="relative">
        <div
          className="user-dropdown bg-cover flex border h-6 py-3.5 px-6 rounded-full 
          hover:brightness-125 hover:cursor-pointer opacity-90"
          onClick={toggleDropdown}
        >
          <div className="flex space-x-1.5 items-center">
            <img src={image} alt="profile" className="w-6 h-6 border-white" />
            <span className="text-white font-bold tracking-wide">
              {username}
            </span>
            <i className="fa-regular fa-angle-down text-white font-bold pt-0.5"></i>
          </div>
        </div>
        {isDropdownOpen && (
          <div
            className="absolute user-dropdown bg-cover right-0 mt-0.5 w-full
           bg-white rounded-full shadow-md z-10"
          >
            <a
              onClick={handleLogout}
              className="block px-4 py-2 text-white font-bold tracking-wider
               cursor-pointer hover:text-white"
            >
              Logout
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
