import { CSSProperties, useEffect, useState } from "react";
import { Playlist } from "../interfaces";

interface ContextMenuProps {
  contextMenuItemId: string | null;
  itemType: "track" | "artist" | "playlist" | "album" | null;
  onRemoveTrack: () => void;
  onAddToLikedSongs: () => void;
  onAddToPlaylist: (playlistId: string) => void;
  onFollowArtist: () => void;
  onAddPlaylistToLibrary: () => void;
  onAddAlbumToLibrary: () => void;
  position: { x: number; y: number };
  isOwner: boolean;
  onClose: () => void;
  userPlaylists: Playlist[];
}

const ContextMenu = ({
  itemType,
  position,
  onClose,
  onAddToLikedSongs,
  onAddToPlaylist,
  onRemoveTrack,
  onFollowArtist,
  onAddPlaylistToLibrary,
  onAddAlbumToLibrary,
  isOwner,
  userPlaylists,
}: ContextMenuProps) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [isMouseInMenu, setIsMouseInMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      if (!isMouseInMenu) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, isMouseInMenu]);

  const style: CSSProperties = {
    top: position.y,
    left: position.x,
    position: "fixed",
    zIndex: 1000,
    backgroundColor: "#111",
    color: "#ccc",
    borderRadius: "2px",
    padding: "2px",
    transform: "translateX(-100%)",
  };

  const submenuStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    right: "100%",
    marginTop: 0,
    backgroundColor: "#111",
    color: "#ccc",
    borderRadius: "2px",
    padding: "2px",
  };

  return (
    <div
      id="context-menu"
      style={style}
      onMouseEnter={() => setIsMouseInMenu(true)}
      onMouseLeave={() => setIsMouseInMenu(false)}
    >
      <ul>
        {itemType === "track" && (
          <>
            <li
              onClick={onAddToLikedSongs}
              className="p-2 hover:bg-gray-900 cursor-pointer"
            >
              Add to Liked Songs
            </li>
            <li
              onMouseEnter={() => setIsSubMenuOpen(true)}
              onMouseLeave={() => setIsSubMenuOpen(false)}
              className="p-2 hover:bg-gray-900 cursor-pointer relative"
            >
              Add to Playlist
              {isSubMenuOpen && (
                <ul style={submenuStyle}>
                  {userPlaylists.map((playlist) => (
                    <li
                      key={playlist.id}
                      onClick={() => onAddToPlaylist(playlist.id)}
                      className="p-2 hover:bg-gray-700 cursor-pointer"
                    >
                      {playlist.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
            {isOwner && (
              <li
                onClick={onRemoveTrack}
                className="p-2 hover:bg-gray-900 cursor-pointer"
              >
                Remove Track
              </li>
            )}
          </>
        )}
        {itemType === "artist" && (
          <li
            onClick={onFollowArtist}
            className="p-2 hover:bg-gray-900 cursor-pointer"
          >
            Follow Artist
          </li>
        )}
        {itemType === "playlist" && (
          <li
            onClick={onAddPlaylistToLibrary}
            className="p-2 hover:bg-gray-900 cursor-pointer"
          >
            Add Playlist to Library
          </li>
        )}
        {itemType === "album" && (
          <li
            onClick={onAddAlbumToLibrary}
            className="p-2 hover:bg-gray-900 cursor-pointer"
          >
            Add Album to Library
          </li>
        )}
      </ul>
    </div>
  );
};

export default ContextMenu;
