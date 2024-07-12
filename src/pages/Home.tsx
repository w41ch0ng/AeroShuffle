import apiClient from "../spotify";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, Dispatch, SetStateAction } from "react";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { Playlist, Artist, Track } from "../interfaces";
import defaultPlaylistImage from "../assets/images/backgrounds/w7-wallpaper.png";
import playButton from "../assets/images/sprites/play-button.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import backButton from "../assets/images/sprites/back-button.png";
import forwardButton from "../assets/images/sprites/forward-button.png";
import explicitIcon from "../assets/images/sprites/explicit.png";

interface HomeProps {
  onPlay: (id: string) => void;
  onArtistPlay: Dispatch<SetStateAction<Track[] | null>>;
  onTrackPlay: (uris: string[]) => void;
}

export default function Library({
  onPlay,
  onArtistPlay,
  onTrackPlay,
}: HomeProps) {
  const featuredPlaylistsContainerRef = useRef<HTMLDivElement>(null);
  const { categories, setCategories } = useUserSearchCategory();
  const {
    playlists,
    setPlaylists,
    topTracks,
    setTopTracks,
    setArtistTopTracks,
    topArtists,
    setTopArtists,
  } = useAlbumPlaylist();
  const navigate = useNavigate();

  /* useEffect with getters and setters for user's playlists - for getting
  the user's playlists for the sidebar without page reload - top artists and tracks,
  and browse categories  */
  useEffect(() => {
    apiClient.get("me/playlists").then(function (response) {
      setPlaylists(response.data.items);
    });

    apiClient
      .get("me/top/artists", { params: { limit: 12 } })
      .then((response) => {
        if (response.data && response.data.items) {
          setTopArtists(response.data.items);
        } else {
          console.error(
            "Unexpected response structure for top artists:",
            response
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching top artists:", error);
      });

    apiClient
      .get("me/top/tracks", { params: { limit: 20 } })
      .then((response) => {
        if (response.data && response.data.items) {
          setTopTracks(response.data.items);
        } else {
          console.error(
            "Unexpected response structure for top tracks:",
            response
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching top tracks:", error);
      });

    apiClient
      .get("browse/categories", { params: { limit: 15 } })
      .then(function (response) {
        setCategories(response.data.categories.items);
      });
  }, []);

  // useEffect for handling the scrollability of the browse categories container
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (featuredPlaylistsContainerRef.current) {
        featuredPlaylistsContainerRef.current.scrollLeft += event.deltaY;
      }
    };

    if (featuredPlaylistsContainerRef.current) {
      featuredPlaylistsContainerRef.current.addEventListener(
        "wheel",
        handleWheel
      );
    }

    return () => {
      if (featuredPlaylistsContainerRef.current) {
        featuredPlaylistsContainerRef.current.removeEventListener(
          "wheel",
          handleWheel
        );
      }
    };
  }, []);

  // Functions to make the left and right buttons scroll the categories container
  const scrollLeft = (containerRef: React.RefObject<HTMLDivElement>) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -420,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = (containerRef: React.RefObject<HTMLDivElement>) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 420,
        behavior: "smooth",
      });
    }
  };

  // Navigate to a playlist's page
  const handlePlaylistClick = (id: string) => {
    navigate(`/playlist/${id}`);
  };

  // Navigate to an artist's page
  const handleArtistClick = (id: string) => {
    navigate(`/artist/${id}`);
  };

  // Navigate to an album's page
  const handleTrackClick = (id: string) => {
    navigate(`/album/${id}`);
  };

  // Navigate to a category's page
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
  };

  // Function to get an artist's top tracks and start playing their top tracks
  const fetchArtistTopTracks = (id: string) => {
    // Make a request to get an artists top tracks using the artist ID
    apiClient.get(`artists/${id}/top-tracks?market=US`).then((response) => {
      setArtistTopTracks(response.data.tracks); // Update the artist top tracks state with the response
      onArtistPlay(response.data.tracks); // Play the artist's top tracks
    });
  };

  return (
    <div className="w-full h-[90%] p-4 space-y-10 no-scrollbar overflow-y-auto">
      <div className="w-full">
        <div className="flex relative">
          <h2 className="text-white font-bold text-base tracking-wide mb-4">
            Your Playlists
          </h2>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-0 top-0 h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 ml-4 md:ml-0 hover:no-underline"
          >
            <img src={spotifyLogo} alt="Spotify Logo" className="w-5 h-5" />
            <span className="text-white font-bold text-xs tracking-wide ml-1">
              Open Spotify
            </span>
          </a>
        </div>
        {playlists.length === 0 ? (
          <p className="text-lg text-white">No playlists saved</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.slice(0, 6).map((playlist: Playlist) => (
              <div
                key={playlist.id}
                className="group relative flex items-center rounded-xl p-4 hover:cursor-pointer hover:bg-blue-300 hover:bg-opacity-50 transition-colors duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaylistClick(playlist.id);
                }}
              >
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={playlist?.images?.[0]?.url || defaultPlaylistImage}
                    alt={playlist.name}
                  />
                </div>
                <div className="ml-4 flex-1">
                  <span className="text-white font-bold text-base cursor-pointer">
                    {playlist.name}
                  </span>
                </div>
                <img
                  src={playButton}
                  className="absolute right-1 bottom-1 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(playlist.id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-1/5 sm:h-1/4 xl:h-1/3 relative flex items-center justify-items-center">
        <img
          src={backButton}
          alt="back"
          className="hover:brightness-125 cursor-pointer"
          onClick={() => scrollLeft(featuredPlaylistsContainerRef)}
        />
        <div
          ref={featuredPlaylistsContainerRef}
          className="flex space-x-4 overflow-x-auto snap-x-mandatory no-scrollbar"
          onWheel={(e) => e.stopPropagation()}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-item flex flex-col flex-shrink-0 w-1/3 sm:w-1/5 items-center cursor-pointer"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.icons[0] && (
                <img
                  src={category.icons[0].url}
                  alt={category.name}
                  className="w-30 h-30 mb-2"
                />
              )}
              <span className="text-white font-bold">{category.name}</span>
            </div>
          ))}
        </div>
        <img
          src={forwardButton}
          alt="back"
          className="hover:brightness-125 cursor-pointer pl-2"
          onClick={() => scrollRight(featuredPlaylistsContainerRef)}
        />
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2">
        <div className="w-5/6">
          <h2 className="text-white font-bold text-base tracking-wide mb-4">
            Your Top Artists
          </h2>
          {topArtists.length === 0 ? (
            <p className="text-lg text-white">No top artists found</p>
          ) : (
            <div className="flex flex-col space-y-4 overflow-y-auto h-60 no-scrollbar">
              {topArtists.map((artist: Artist) => (
                <div
                  key={artist.id}
                  className="group flex items-center rounded-xl p-4 hover:cursor-pointer hover:bg-blue-300 hover:bg-opacity-50 transition-colors duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArtistClick(artist.id);
                  }}
                >
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src={artist?.images?.[0]?.url}
                      alt={artist.name}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <span className="text-white font-bold text-base cursor-pointer">
                      {artist.name}
                    </span>
                  </div>
                  <div>
                    <img
                      src="src/assets/images/sprites/play-button.png"
                      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchArtistTopTracks(artist.id);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-5/6">
          <h2 className="text-white font-bold text-base tracking-wide mb-4">
            Your Top Tracks
          </h2>
          {topTracks.length === 0 ? (
            <p className="text-lg text-white">No top tracks found</p>
          ) : (
            <div className="flex flex-col space-y-4 overflow-y-auto h-60 no-scrollbar">
              {topTracks.map((track: Track) => (
                <div
                  key={track.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackClick(track.album.id);
                  }}
                  className="group flex items-center rounded-xl p-4 hover:cursor-pointer hover:bg-blue-300 hover:bg-opacity-50 transition-colors duration-300"
                >
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src={track?.album.images?.[0]?.url}
                      alt={track.name}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex">
                      <span className="text-white font-bold text-base cursor-pointer">
                        {track.name}
                      </span>
                      {track?.explicit && (
                        <img
                          src={explicitIcon}
                          alt="Explicit"
                          className="w-4 h-4 ml-2"
                          title="Explicit"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <img
                      src={playButton}
                      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackPlay([track.uri]);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* <div className="">
        <h1 className="text-white font-bold text-base tracking-wide justify-self-start ml-6 mb-2 mt-3">
          QUEUE
        </h1>
        <div className="flex flex-col h-20 overflow-y-scroll no-scrollbar">
          {tracks &&
            tracks.map((track, index) => (
              <span
                key={track.id}
                className="text-white text-wide px-4 py-2 font-bold"
              >
                {index + 1}. {track.name}
              </span>
            ))}
        </div>
      </div> */}
    </div>
  );
}
