import SidebarButton from "./SidebarButton";
import apiClient from "../spotify";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
//import { usePlayback } from "../contexts/PlayBackContext";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { Playlist } from "../interfaces";
import defaultPlaylistImage from "../assets/images/backgrounds/w7-wallpaper.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import playButton from "../assets/images/sprites/play-button.png";

interface SidebarProps {
  onPlay: (id: string) => void;
  sidebarOpen: boolean | null;
  sidebarClose: (open: boolean | null) => void;
}

export default function Sidebar({
  onPlay,
  sidebarOpen,
  sidebarClose,
}: SidebarProps) {
  //const { tracks } = usePlayback();
  const [playlistName, setPlaylistName] = useState("New Playlist");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false); // useStates for creating new playlist
  const { playlists, setPlaylists } = useAlbumPlaylist();
  const navigate = useNavigate();

  /* useEffect to fetch the user's playlists. Separated the useEffect from the function
  as fetchPlaylists needs to be called multiple times */
  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Function to fetch the user's playlists.
  const fetchPlaylists = async () => {
    try {
      const response = await apiClient.get("me/playlists");
      return response.data.items;
    } catch (error) {
      console.error("Error fetching playlists:", error);
      return [];
    }
  };

  // Function to create a new playlist
  const handleCreatePlaylist = async () => {
    try {
      // Set userId based off the data from the 'me' endpoint
      const userResponse = await apiClient.get("me");
      const userId = userResponse.data.id;

      // Form a createResponse to make a request to create a new playlist
      const createResponse = await apiClient.post(`users/${userId}/playlists`, {
        name: playlistName,
        description: playlistDescription,
        public: isPublic,
      });

      // Set the playlistId to the Id from the createResponse new playlist response
      const playlistId = createResponse.data.id;

      // Fetch updated playlists immediately after creating new playlist
      const updatedPlaylists = await fetchPlaylists();
      if (updatedPlaylists) {
        setPlaylists(updatedPlaylists);
      }

      // Reset the form fields and state after creating the playlist
      setPlaylistName("New Playlist");
      setPlaylistDescription("");
      setIsPublic(false);

      // Navigate to new playlist page
      navigate(`/playlist/${playlistId}`);

      // Toggle sidebar after playlist creation
      toggleSidebar();
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  // Navigate to a playlist's page
  const handlePlaylistClick = (id: string) => {
    navigate(`/playlist/${id}`);
  };

  // Toggle the sidebar
  const toggleSidebar = () => {
    sidebarClose(!sidebarOpen);
  };

  return (
    <div
      className={`fixed md:relative w-full sidebar bg-cover flex-col overflow-y-scroll no-scrollbar bg-slate-400 opacity-80 rounded-br-xl border-b border-r border-gray-200 ${
        sidebarOpen ? "block" : "hidden"
      } h-5/6 md:h-full md:flex md:w-2/6 lg:w-1/5 lg:max-w-80`}
    >
      <i
        className="fa-solid fa-bars hover:cursor-pointer text-white text-lg md:hidden absolute top-1 right-6"
        onClick={toggleSidebar}
      ></i>
      <div className="grid justify-items-center flex-col pt-8 pb-2 space-y-4">
        <SidebarButton
          label="Home"
          icon="house"
          to="/"
          onClick={toggleSidebar}
        />
        <SidebarButton
          label="Search"
          icon="magnifying-glass"
          to="/search"
          onClick={toggleSidebar}
        />
        <SidebarButton
          label="Library"
          icon="list"
          to="/library"
          onClick={toggleSidebar}
        />
      </div>
      <div className="h-5/6">
        <div className="flex items-center mb-2 justify-normal md:justify-evenly xl:justify-normal xl:space-x-5">
          <h1 className="text-white font-bold text-base tracking-wide justify-self-start ml-16 md:ml-2 xl:pl-5 ">
            PLAYLISTS
          </h1>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 md:px-1 ml-4 md:ml-0 hover:no-underline"
          >
            <img src={spotifyLogo} alt="Spotify Logo" className="w-5 h-5" />
            <span className="text-white font-bold text-xs tracking-wide ml-1">
              Open Spotify
            </span>
          </a>
        </div>
        <div className="grid justify-items-center text-white font-bold space-y-4">
          <SidebarButton
            label="Create Playlist"
            icon="plus"
            onClick={handleCreatePlaylist}
          />
          {/* <SidebarButton
            label="Create Playlist"
            icon="plus"
            to="/create-playlist"
            onClick={toggleSidebar}
          /> */}
          <SidebarButton
            label="Liked Songs"
            icon="heart"
            to="/liked-songs"
            onClick={toggleSidebar}
          />
        </div>
        <div className="flex flex-col pb-4 m-3 space-y-1">
          {playlists?.map((playlist: Playlist) => (
            <div
              key={playlist.id}
              className="group relative flex items-center rounded-xl p-4 hover:cursor-pointer hover:bg-blue-300 hover:bg-opacity-50 transition-colors duration-300"
              onClick={(e) => {
                e.stopPropagation();
                handlePlaylistClick(playlist.id);
                toggleSidebar();
              }}
            >
              <div className="flex flex-row items-center justify-between">
                <div className="items-center w-16 h-16 flex-shrink-0">
                  <img
                    className="relative w-full h-full object-cover cursor-pointer"
                    src={playlist?.images?.[0]?.url || defaultPlaylistImage}
                    alt={playlist.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaylistClick(playlist.id);
                      toggleSidebar();
                    }}
                  />
                </div>
                <p className="pl-2 text-white font-bold text-base cursor-pointer text-ellipsis">
                  {playlist.name}
                </p>
              </div>
              <img
                src={playButton}
                className="absolute right-2 bottom-1 w-8 h-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(playlist.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* <div className="flex flex-col h-1/4">
        <h1 className="text-white font-bold text-base tracking-wide justify-self-start ml-6 mb-2 mt-3">
          QUEUE
        </h1>
        <div className="flex flex-col overflow-y-auto no-scrollbar">
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
