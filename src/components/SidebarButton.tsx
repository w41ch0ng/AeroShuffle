import React from "react";
import { useNavigate } from "react-router-dom";

interface SidebarButtonProps {
  label: string;
  icon: string;
  to?: string;
  onClick?: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  label,
  icon,
  to,
  onClick,
}) => {
  const navigate = useNavigate();

  /* Function to handle clicking a sidebar button; if there is a (to) element,
  navigate to the (to) link, if there is an onClick function, commit the
  onClick function */
  const handleClick = () => {
    if (to) {
      navigate(to);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className="h-8 w-4/5 text-white font-bold tracking-wide border-2 border-white rounded-l-xl 
      relative flex items-center hover:text-white hover:cursor-pointer hover:bg-blue-300 hover:brightness-110"
      onClick={handleClick}
    >
      <i className={`fa-solid fa-${icon} absolute left-2`}></i>
      <span className="ml-11">{label}</span>
    </div>
  );
};

export default SidebarButton;
