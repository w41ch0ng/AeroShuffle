import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";
import { useContextMenu } from "../contexts/ContextMenuContext";
import ContextMenu from "../components/ContextMenu";
import { LikedSongs, Track } from "../interfaces";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import playButton from "../assets/images/sprites/play-button.png";
import explicitIcon from "../assets/images/sprites/explicit.png";

interface LikedSongsProps {
  onPlay: (likedSongs: Track[]) => void;
  onTrackPlay: (uris: string[]) => void;
}

export default function LikedSongsPage({
  onPlay,
  onTrackPlay,
}: LikedSongsProps) {
  const { userId, setUserId } = useUserSearchCategory();
  const { playlists, setPlaylists, likedSongs, setLikedSongs } =
    useAlbumPlaylist();
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

  // Getters and setters for user's liked songs and for the user Id.
  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const response = await apiClient.get<LikedSongs>("me/tracks");
        setLikedSongs(response.data.items.map((item) => item.track));
        const userResponse = await apiClient.get("me");
        setUserId(userResponse.data.id);
      } catch (error) {
        console.error("API Error:", error);
      }
    };
    fetchLikedSongs();
  }, []);

  // Function to format the duration from the payload format to minutes and seconds
  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Navigate to an album's page
  const handleAlbumClick = (albumId: string) => {
    navigate(`/album/${albumId}`);
  };

  // Navigate to an artist's page
  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  return (
    <div className="h-[90%] w-full no-scrollbar overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center">
          <img
            src={likedSongs[0]?.album?.images[0].url}
            alt={likedSongs[0]?.album?.name}
            className="w-32 h-32 mr-4"
          />
          <div>
            <h1 className="text-3xl text-white font-bold tracking-wider mb-2">
              Liked Songs
            </h1>
            <div className="flex">
              <img
                src={playButton}
                className="w-10 h-10 ml-2 hover:cursor-pointer hover:brightness-125"
                onClick={() => onPlay(likedSongs)}
              />
              <a
                href="https://open.spotify.com/collection/tracks"
                target="_blank"
                rel="noopener noreferrer"
                className="h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 ml-4 md:ml-2 hover:no-underline"
              >
                <img src={spotifyLogo} alt="Spotify Logo" className="w-5 h-5" />
                <span className="text-white font-bold text-xs tracking-wide ml-1">
                  Open Spotify
                </span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white">
            <thead>
              <tr>
                <th className="hidden md:flex flex-row p-4">#</th>
                <th className="p-4">Title</th>
                <th className="p-4">Album</th>
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {likedSongs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-white">
                    No liked songs saved.
                  </td>
                </tr>
              ) : (
                likedSongs.map((track, index) => (
                  <tr
                    key={`${track.id}-${index}`}
                    className="group hover:brightness-125"
                    onContextMenu={(e) =>
                      handleContextMenu(e, track.id, "track")
                    }
                  >
                    <td className="hidden md:table-cell p-4">{index + 1}</td>
                    <td className="p-4 flex items-center">
                      {track.album.images[0] && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-12 h-12 mr-4"
                        />
                      )}
                      <div>
                        <h3 className="text-white font-bold text-base tracking-wide">
                          {track.name}
                        </h3>
                        <p className="text-gray-300">
                          {track.artists.map((artist, index) => (
                            <span
                              key={artist.id}
                              className="hover:underline cursor-pointer"
                              onClick={() => handleArtistClick(artist.id)}
                            >
                              {artist.name}
                              {index < track.artists.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </p>
                      </div>
                      {track?.explicit && (
                        <img
                          src={explicitIcon}
                          alt="Explicit"
                          className="w-4 h-4 ml-2"
                          title="Explicit"
                        />
                      )}
                    </td>
                    <td
                      className="p-4 text-gray-300 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlbumClick(track.album?.id);
                      }}
                    >
                      {track.album?.name}
                    </td>
                    <td className="p-4">{formatDuration(track.duration_ms)}</td>
                    <td className="p-4 text-right flex">
                      <img
                        src={playButton}
                        className="w-9 h-9 mx-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer"
                        onClick={() => onTrackPlay([track.uri])}
                      />
                      <span
                        onClick={(e) => handleContextMenu(e, track.id, "track")}
                        className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
                      >
                        ...
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          isOwner={true}
          userPlaylists={playlists.filter(
            (playlist) => playlist.owner.id === userId
          )}
        />
      )}
    </div>
  );
}
