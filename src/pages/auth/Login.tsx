import React from "react";
import iconGif from "../../assets/images/sprites/aero-shuffle-gif.gif";
import iconPng from "../../assets/images/sprites/aero-shuffle.png";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <picture>
        <source srcSet={iconGif} type="image/gif" />
        <img src={iconPng} className="w-40 login-image" alt="Login Icon" />
      </picture>
      <h1 className="text-4xl text-white tracking-wider font-bold">
        Aero Shuffle
      </h1>
      <a
        onClick={onLogin}
        className="h-5 flex items-center justify-center text-center rounded-full border-2 px-8 py-4 ml-4 md:ml-0 hover:no-underline hover:bg-blue-300 hover:brightness-110"
      >
        <span className="text-white font-bold text-xs tracking-wide">
          Log In
        </span>
      </a>
      <div className="absolute bottom-2 right-2 rounded-full bg-gray-400 bg-opacity-40 p-4 text-center">
        <h2 className="text-white font-bold text-xs tracking-wide">
          This is a closed beta. <br></br>Logging in with an unapproved Spotify
          account will <br></br> not allow you to use the app.
        </h2>
      </div>
    </div>
  );
};

export default Login;
