import React, { ReactNode } from "react";

interface MainInterfaceProps {
  children: ReactNode;
  sidebarOpen: boolean | null;
  sidebarClose: (open: boolean | null) => void;
}

const MainInterface: React.FC<MainInterfaceProps> = ({
  children,
  sidebarOpen,
}) => {
  return (
    <div
      className={`main-ui w-full md:w-4/6 lg:w-4/5 ${
        sidebarOpen ? "hidden md:block" : "block"
      }`}
    >
      {children}
    </div>
  );
};

export default MainInterface;
