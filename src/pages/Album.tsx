import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { useContextMenu } from "../contexts/ContextMenuContext";
import ContextMenu from "../components/ContextMenu";
import { Album } from "../interfaces";
import playButton from "../assets/images/sprites/play-button.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import explicitIcon from "../assets/images/sprites/explicit.png";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";

interface AlbumProps {
  onPlay: (id: string) => void;
  onTrackPlay: (uris: string[]) => void;
}

export default function AlbumPage({ onPlay, onTrackPlay }: AlbumProps) {
  const { id } = useParams<{ id: string }>();
  const { userId, setUserId } = useUserSearchCategory();
  const {
    album,
    setAlbum,
    setAlbums,
    playlists,
    setPlaylists,
    inLibrary,
    setInLibrary,
  } = useAlbumPlaylist();
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

  /* useEffect including getters and setters for the album, userId, and the
  'in library' state of the album for the 'add to library'/'remove from library' icons */
  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await apiClient.get<Album>(`albums/${id}`);
        setAlbum(response.data);
        const libraryResponse = await apiClient.get("me/albums/contains", {
          params: { ids: id },
        });
        setInLibrary(libraryResponse.data[0]);

        const userResponse = await apiClient.get("me");
        setUserId(userResponse.data.id);
      } catch (error) {
        console.error("API Error:", error);
      }
    };

    fetchAlbum();
  }, [id]);

  // Function to get the user's albums
  const fetchAlbums = async () => {
    try {
      const response = await apiClient.get("me/albums");
      return response.data.items;
    } catch (error) {
      console.error("Error fetching albums:", error);
      return [];
    }
  };

  // Function to format the duration from the payload format to minutes and seconds
  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Navigate to an artist's page
  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  // Function for the user to remove the album from their library
  const handleRemoveAlbum = async () => {
    if (
      // Confirm deletion
      window.confirm(
        "Are you sure you want to remove this album from your library?"
      )
    ) {
      try {
        // Make the deletion request using the album id
        await apiClient.delete(`me/albums`, { data: { ids: [id] } });
        /* If deletion is successful, navigate the user back to the library
        and set the inLibrary state to false as the album has been removed */
        navigate("/library");
        setInLibrary(false);
        // Also update the albums state
        const albums = await fetchAlbums();
        setAlbums(albums);
      } catch (error) {
        console.error("Error removing album:", error);
      }
    }
  };

  // Function for the user to add the album to their library
  const handleAddAlbum = async () => {
    try {
      // Make the add request using the album id
      await apiClient.put(`me/albums`, { ids: [album?.id] });
      setInLibrary(true);
      // Update the albums state
      const albums = await fetchAlbums();
      if (albums) {
        setAlbums(albums);
      }
    } catch (error) {
      console.error("Error adding album:", error);
    }
  };

  if (!album) {
    return <div></div>;
  }

  return (
    <div className="h-[90%] w-full no-scrollbar overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center">
          <img
            src={album.images[0].url}
            alt={album.name}
            className="w-32 h-32 mr-4"
          />
          <div>
            <h1 className="text-3xl text-white font-bold tracking-wider">
              {album.name}
            </h1>
            <p className="text-white">{album.release_date}</p>
            <div className="flex mt-2">
              {inLibrary ? (
                <i
                  onClick={handleRemoveAlbum}
                  className=" fa-regular fa-circle-check text-2xl text-white px-1 py-1 hover:cursor-pointer"
                ></i>
              ) : (
                <i
                  onClick={handleAddAlbum}
                  className="fa-regular fa-plus text-2xl text-white px-1 py-1 hover:cursor-pointer"
                ></i>
              )}
              <img
                src={playButton}
                className="w-10 h-10 ml-2 hover:cursor-pointer hover:brightness-125"
                onClick={() => onPlay(album.id)}
              />
              <a
                href={`https://open.spotify.com/album/${id}`}
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
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {album.tracks.items.map((track, index) => (
                <tr
                  key={`${track.id}-${index}`}
                  className="group hover:brightness-125"
                  onContextMenu={(e) => handleContextMenu(e, track.id, "track")}
                >
                  <td className="hidden md:table-cell p-4">{index + 1}</td>
                  <td className="p-4 flex items-center">
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
              ))}
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
          isOwner={false}
          userPlaylists={playlists.filter(
            (playlist) => playlist.owner.id === userId
          )}
        />
      )}
    </div>
  );
}
