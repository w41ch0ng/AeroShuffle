import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";
import { useContextMenu } from "../contexts/ContextMenuContext";
import ContextMenu from "../components/ContextMenu";
import { Track, Album } from "../interfaces";
import playButton from "../assets/images/sprites/play-button.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import backButton from "../assets/images/sprites/back-button.png";
import forwardButton from "../assets/images/sprites/forward-button.png";
import explicitIcon from "../assets/images/sprites/explicit.png";

interface ArtistProps {
  onPlay: (topTracks: Track[]) => void;
  onAlbumPlay: (id: string) => void;
  onTrackPlay: (uris: string[]) => void;
}

export default function Artist({
  onPlay,
  onAlbumPlay,
  onTrackPlay,
}: ArtistProps) {
  const { id } = useParams<{ id: string }>();
  const { userId, setUserId } = useUserSearchCategory();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    albums,
    setAlbums,
    playlists,
    setPlaylists,
    artistTopTracks,
    setArtistTopTracks,
    artist,
    setArtist,
    isFollowing,
    setIsFollowing,
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

  /* useEffect including getters and setters for the artist's details, top tracks, albums, and
  userId, and the user's 'following' state of the artist for the 'follow'/'unfollow' icons */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          artistResponse,
          topTracksResponse,
          albumsResponse,
          userResponse,
        ] = await Promise.all([
          apiClient.get(`artists/${id}`),
          apiClient.get(`artists/${id}/top-tracks?market=US`),
          apiClient.get(`artists/${id}/albums`),
          apiClient.get(`me`),
        ]);

        setArtist(artistResponse.data);
        setArtistTopTracks(topTracksResponse.data.tracks);
        setAlbums(albumsResponse.data.items);
        setUserId(userResponse.data.id);

        const followResponse = await apiClient.get(
          `me/following/contains?type=artist&ids=${id}`
        );
        console.log("Follow response:", followResponse.data);
        setIsFollowing(followResponse.data[0]);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  /* Function to follow the artist by making a request to add the artist to the user's 
  following from the artist id */
  const handleFollowArtist = async () => {
    try {
      await apiClient.put(`me/following?type=artist&ids=${id}`);
    } catch (error) {
      console.error("Error following artist:", error);
    }
    setIsFollowing(true);
  };

  /* Function to unfollow the artist by making a request to remove the artist to the user's 
  following from the artist id */
  const handleUnfollowArtist = async () => {
    try {
      await apiClient.delete(`me/following?type=artist&ids=${id}`);
    } catch (error) {
      console.error("Error unfollowing artist:", error);
    }
    setIsFollowing(false);
  };

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

  // useEffect for handling the scrollability of the artist's albums container
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (containerRef.current) {
        containerRef.current.scrollLeft += event.deltaY;
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener("wheel", handleWheel);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  // Functions to make the left and right buttons scroll the album container
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -420,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 420,
        behavior: "smooth",
      });
    }
  };

  if (!artist) {
    return <div></div>;
  }

  return (
    <div className="h-[90%] w-full no-scrollbar overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center">
          <img
            src={artist.images[0]?.url}
            alt={artist.name}
            className="w-32 h-32 mr-4"
          />
          <div>
            <h1 className="text-3xl text-white font-bold tracking-wider">
              {artist.name}
            </h1>
            <p className="text-blue-300">{artist.followers.total} followers</p>
            <p className="text-white capitalize">{artist.genres.join(", ")}</p>
            <div className="flex mt-2">
              {isFollowing ? (
                <i
                  onClick={handleUnfollowArtist}
                  className=" fa-regular fa-circle-check text-2xl text-white px-1 py-1 hover:cursor-pointer"
                ></i>
              ) : (
                <i
                  onClick={handleFollowArtist}
                  className="fa-regular fa-plus text-2xl text-white px-1 py-1 hover:cursor-pointer"
                ></i>
              )}
              <img
                src={playButton}
                className="w-10 h-10 ml-2 hover:cursor-pointer hover:brightness-125"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(artistTopTracks);
                }}
              />

              <a
                href={`https://open.spotify.com/artist/${id}`}
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
        <div className="mt-4 overflow-x-hidden md:overflow-x-auto">
          <h2 className="text-2xl text-white font-bold">Top Tracks</h2>
          <table className="min-w-full text-left text-sm text-white">
            <thead>
              <tr>
                <th className="p-4 hidden md:flex flex-row ">#</th>
                <th className="p-4">Title</th>
                <th className="p-4">Album</th>
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {artistTopTracks.map((track, index) => (
                <tr
                  key={`${track.id}-${index}`}
                  className="group hover:brightness-125"
                  onContextMenu={(e) => handleContextMenu(e, track.id, "track")}
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
                      handleAlbumClick(track.album.id);
                    }}
                  >
                    {track.album.name}
                  </td>
                  <td className="p-4">{formatDuration(track.duration_ms)}</td>
                  <td className="p-4 text-right flex">
                    <img
                      src={playButton}
                      className="w-9 h-9 mx-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
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

        <div className="mt-4">
          <h2 className="text-2xl text-white font-bold">Albums</h2>
          <div className="flex items-center">
            <img
              src={backButton}
              alt="back"
              className="hover:brightness-125 cursor-pointer"
              onClick={scrollLeft}
            />
            <div
              ref={containerRef}
              className="flex overflow-x-auto snap-x-mandatory no-scrollbar"
            >
              {albums.map((album: Album) => (
                <div key={album.id} className="flex-shrink-0 w-1/5 mx-2 group">
                  <div className="flex flex-col">
                    <div className="relative">
                      <img
                        className="w-full h-auto cursor-pointer hover:brightness-110 relative"
                        src={album?.images?.[0]?.url}
                        alt={album.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAlbumClick(album.id);
                        }}
                      />
                      <img
                        src={playButton}
                        className="absolute right-2 bottom-2 w-10 h-10 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAlbumPlay(album.id);
                        }}
                      />
                    </div>
                    <div className="flex justify-center">
                      <span className="text-center mt-2 cursor-pointer text-white font-bold text-base tracking-wide">
                        {album.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <img
              src={forwardButton}
              alt="forward"
              className="hover:brightness-125 cursor-pointer pl-2"
              onClick={scrollRight}
            />
          </div>
          {/* <ul>
            {albums.map((album) => (
              <li key={album.id} className="mt-2">
                <div
                  className="flex items-center"
                  onClick={() => handleAlbumClick(album.id)}
                >
                  <img
                    src={album.images[0]?.url}
                    alt={album.name}
                    className="w-12 h-12 mr-4 rounded-xl"
                  />
                  <div>
                    <h3 className="text-white font-bold text-base tracking-wide">
                      {album.name}
                    </h3>
                    <p className="text-gray-700">{album.release_date}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul> */}
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
