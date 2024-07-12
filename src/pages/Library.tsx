import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { Playlist, Album } from "../interfaces";
import defaultPlaylistImage from "../assets/images/backgrounds/w7-wallpaper.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import playButton from "../assets/images/sprites/play-button.png";

interface LibraryProps {
  onPlay: (id: string) => void;
}

export default function Library({ onPlay }: LibraryProps) {
  const { playlists, setPlaylists, albums, setAlbums } = useAlbumPlaylist();
  const navigate = useNavigate();

  // Navigate to a playlist's page
  const handlePlaylistClick = (id: string) => {
    navigate(`/playlist/${id}`);
  };

  // Navigate to an album's page
  const handleAlbumClick = (id: string) => {
    navigate(`/album/${id}`);
  };

  // Getters and setters for user's playlists and albums
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await apiClient.get("me/playlists");
        setPlaylists(response.data.items);
      } catch (error) {
        console.error("Error fetching playlists", error);
      }
    };

    const fetchAlbums = async () => {
      try {
        const response = await apiClient.get("me/albums");
        setAlbums(
          response.data.items.map((item: { album: Album }) => item.album)
        );
      } catch (error) {
        console.error("Error fetching albums", error);
      }
    };

    fetchPlaylists();
    fetchAlbums();
  }, [setPlaylists, setAlbums]);

  return (
    <div className="w-full h-[95%] p-4 relative flex flex-col items-center justify-center space-y-4 md:space-y-0 sm:flex-row">
      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-2 h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 ml-4 md:ml-0 hover:no-underline"
      >
        <img src={spotifyLogo} alt="Spotify Logo" className="w-5 h-5" />
        <span className="text-white font-bold text-xs tracking-wide ml-1">
          Open Spotify
        </span>
      </a>
      <div className="w-4/5 sm:w-[45%] h-full overflow-y-auto no-scrollbar scroll-smooth">
        <h1 className="text-xl font-bold text-white mb-4">Playlists</h1>
        {playlists.length === 0 ? (
          <p className="text-lg text-white">No playlists saved</p>
        ) : (
          playlists.map((playlist: Playlist) => (
            <div
              key={playlist.id}
              className="group relative flex items-center justify-center rounded-xl py-2 hover:cursor-pointer hover:bg-blue-300 hover:bg-opacity-50 transition-colors duration-300"
            >
              <div className="flex flex-col">
                <div className="items-center 2xl:w-[500px] 2xl:h-[500px] xl:w-[440px] xl:h-[440px] lg:w-72 lg:h-72 md:w-52 md:h-52 w-48 h-48 flex-shrink-0">
                  <img
                    className="w-full h-full object-cover cursor-pointer hover:brightness-110"
                    src={playlist?.images?.[0]?.url || defaultPlaylistImage}
                    alt={playlist.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaylistClick(playlist.id);
                    }}
                  />
                </div>
                <div className="">
                  <span className="text-center mt-2 cursor-pointer text-white font-bold text-base tracking-wide">
                    {playlist.name}
                  </span>
                </div>
              </div>
              <img
                src={playButton}
                className="absolute right-2 bottom-1 w-8 h-8 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(playlist.id);
                }}
              />
            </div>
          ))
        )}
      </div>
      <div className="w-4/5 sm:w-[45%] h-full overflow-y-auto no-scrollbar md:ml-4">
        <h1 className="text-xl font-bold text-white mb-4">Albums</h1>
        {albums.length === 0 ? (
          <p className="text-lg text-white">No albums saved</p>
        ) : (
          albums.map((album: Album) => (
            <div
              key={album.id}
              className="group relative flex items-center justify-center rounded-xl py-2 hover:cursor-pointer hover:bg-blue-300 hover:bg-opacity-50 transition-colors duration-300"
            >
              <div className="flex flex-col">
                <div className="items-center 2xl:w-[500px] 2xl:h-[500px] xl:w-[440px] xl:h-[440px] lg:w-72 lg:h-72 md:w-52 md:h-52 w-48 h-48 flex-shrink-0">
                  <img
                    className="w-full h-full object-cover cursor-pointer hover:brightness-110"
                    src={album?.images?.[0]?.url}
                    alt={album.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlbumClick(album.id);
                    }}
                  />
                </div>
                <div className=" w-4/5">
                  <span className="text-center mt-2 cursor-pointer text-white font-bold text-base tracking-wide">
                    {album.name}
                  </span>
                </div>
              </div>
              <img
                src={playButton}
                className="absolute right-2 bottom-1 w-8 h-8 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(album.id);
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
