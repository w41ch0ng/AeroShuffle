import iconGif from "../assets/images/sprites/aero-shuffle-gif.gif";
import iconPng from "../assets/images/sprites/aero-shuffle.png";

export default function Topbar() {
  return (
    <div className="title-bar draggable h-8">
      <div className="flex">
        <picture>
          <source srcSet={iconGif} type="image/gif" />
          <img src={iconPng} className="h-5" alt="Icon" />
        </picture>
        <div className="title-bar-text px-2 py-0.5">Aero Shuffle</div>
      </div>
      <div className="title-bar-controls">
        <button
          id="minimize"
          aria-label="Minimize"
          className="minimizeButton"
        ></button>
        <button id="close" aria-label="Close" className="closeButton"></button>
      </div>
    </div>
  );
}
