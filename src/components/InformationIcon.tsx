import { ReactNode, useState } from "react";

interface InformationIconProps {
  content: string;
  children: ReactNode;
}

const InformationIcon: React.FC<InformationIconProps> = ({
  content,
  children,
}) => {
  const [showInformationIcon, setShowInformationIcon] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowInformationIcon(true)}
      onMouseLeave={() => setShowInformationIcon(false)}
    >
      {children}
      {showInformationIcon && (
        <div className="absolute bg-gray-700 text-white p-2 rounded-md text-xs max-w-xs z-10">
          {content}
        </div>
      )}
    </div>
  );
};

export default InformationIcon;
