import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import defaultPlaylistImage from "../assets/images/backgrounds/w7-wallpaper.png";
import { useContextMenu } from "../contexts/ContextMenuContext";
import ContextMenu from "../components/ContextMenu";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";

interface CategoryPageProps {
  onPlaylistPlay: (id: string) => void;
}

export default function CategoryPage({ onPlaylistPlay }: CategoryPageProps) {
  const { id } = useParams<{ id: string }>();
  const {
    userId,
    setUserId,
    categoryPlaylists,
    setCategoryPlaylists,
    category,
    setCategory,
  } = useUserSearchCategory();
  const { playlists: userPlaylists, setPlaylists } = useAlbumPlaylist();
  const {
    contextMenuItemId,
    contextMenuPosition,
    itemType,
    setContextMenuItem,
    handleContextMenu,
    handleAddToLikedSongs,
    handleAddToPlaylist,
    handleRemoveTrack,
    handleFollowArtist,
    handleAddPlaylistToLibrary,
    handleAddAlbumToLibrary,
  } = useContextMenu()!;
  const navigate = useNavigate();

  /* Getter and setter for user's playlists. Implemented for getting
  the user's playlists for the sidebar without page reload */
  useEffect(() => {
    apiClient.get("me/playlists").then(function (response) {
      setPlaylists(response.data.items);
    });
  }, [setPlaylists]);

  /* useEffect with getters and setters for Spotify categories, playlists within
  a category, and userId */
  useEffect(() => {
    console.log("Category ID from URL:", id);
    if (id) {
      apiClient
        .get(`browse/categories/${id}/playlists`, {
          params: { limit: 20 },
        })
        .then((response) => {
          setCategoryPlaylists(response.data.playlists.items);
        })
        .catch((error) =>
          console.error("Error fetching category playlists:", error)
        );

      apiClient
        .get(`browse/categories/${id}`)
        .then((response) => {
          setCategory(response.data);
        })
        .catch((error) =>
          console.error("Error fetching category details:", error)
        );
    }

    apiClient.get("me").then((response) => setUserId(response.data.id));
  }, [id]);

  // Navigate to a playlist's page
  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  return (
    <div className="category-page h-[90%] w-full no-scrollbar overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center">
          {category && (
            <div className="category-header mb-4">
              <h1 className="text-3xl text-white font-bold mb-2">
                {category.name}
              </h1>
              <div className="flex items-center space-x-5">
                {category.icons[0] && (
                  <img
                    src={category.icons[0].url}
                    alt={category.name}
                    className="w-24 h-24 mb-2"
                  />
                )}

                <a
                  href={`https://open.spotify.com/genre/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 ml-4 md:ml-0 hover:no-underline"
                >
                  <img
                    src={spotifyLogo}
                    alt="Spotify Logo"
                    className="w-5 h-5"
                  />
                  <span className="text-white font-bold text-xs tracking-wide ml-1">
                    Open Spotify
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="playlists-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {categoryPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="playlist-item flex flex-col items-center cursor-pointer"
              onClick={() => handlePlaylistClick(playlist.id)}
              onContextMenu={(e) =>
                handleContextMenu(e, playlist.id, "playlist")
              }
            >
              <img
                src={playlist.images[0]?.url || defaultPlaylistImage}
                alt={playlist.name}
                className="w-32 h-32 mb-2"
              />
              <span className="text-white font-bold text-center">
                {playlist.name}
              </span>
              <img
                src="src/assets/images/sprites/play-button.png"
                className="w-9 h-9 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaylistPlay(playlist.id);
                }}
              />
              <span
                onClick={(e) => handleContextMenu(e, playlist.id, "playlist")}
                className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
              >
                ...
              </span>
            </div>
          ))}
        </div>
      </div>
      {contextMenuItemId && (
        <ContextMenu
          contextMenuItemId={contextMenuItemId}
          itemType={itemType}
          onRemoveTrack={handleRemoveTrack}
          onAddToLikedSongs={handleAddToLikedSongs}
          onAddToPlaylist={handleAddToPlaylist}
          onFollowArtist={handleFollowArtist}
          onAddAlbumToLibrary={handleAddAlbumToLibrary}
          onAddPlaylistToLibrary={handleAddPlaylistToLibrary}
          position={contextMenuPosition}
          onClose={() => setContextMenuItem(null, null)}
          isOwner={false}
          userPlaylists={userPlaylists.filter(
            (playlist) => playlist.owner.id === userId
          )}
        />
      )}
    </div>
  );
}
