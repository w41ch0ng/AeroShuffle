import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import Library from "./pages/Library";
import Home from "./pages/Home";
import LikedSongs from "./pages/LikedSongs";
import Album from "./pages/Album";
import Playlist from "./pages/Playlist";
import Artist from "./pages/Artist";
import Search from "./pages/Search";
import Category from "./pages/Category";
import Player from "./components/Player";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Userbar from "./components/Userbar";
import MainInterface from "./components/MainInterface";
import "7.css";
import {
  setClientToken,
  getUserProduct,
  fetchAccessToken,
  getLoginEndpoint,
  refreshAccessToken,
} from "./spotify";
import apiClient from "./spotify";
import { PlaybackProvider } from "./contexts/PlayBackContext";
import { ContextMenuProvider } from "./contexts/ContextMenuContext";
import { AlbumPlaylistProvider } from "./contexts/AlbumPlaylistContext";
import { UserSearchCategoryProvider } from "./contexts/UserSearchCategoryContext";
import { Track } from "./interfaces";

export default function App() {
  const [token, setToken] = useState<string>(""); // Access token state
  const [playlistId, setPlaylistId] = useState<string | null>(null); // Playlist ID state
  const [albumId, setAlbumId] = useState<string | null>(null); // Album ID state
  const [trackUris, setTrackUris] = useState<string[] | null>(null); // Track URIs state
  const [topTracks, setTopTracks] = useState<Track[] | null>(null); // Top tracks state
  const [likedSongs, setLikedSongs] = useState<Track[] | null>(null); // Liked songs state
  const [deviceId, setDeviceId] = useState<string | null>(null); // Spotify Player Device ID
  const [sdkWebPlayer, setSdkWebPlayer] = useState<Spotify.Player | null>(null); // Web Player state
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null); // Sidebar state
  const [userProduct, setUserProduct] = useState<string | null>(null); // Free/Premium state
  const [username, setUsername] = useState("User");
  const [image, setImage] = useState(
    "src/assets/images/sprites/profile-picture.png"
  );

  const token_check_interval = 60000; // Interval to check token validity

  // useEffect to handle authentication and token management
  useEffect(() => {
    const localToken = window.localStorage.getItem("token");
    const tokenExpiryTime = window.localStorage.getItem("tokenExpiry");

    const fetchToken = async (code: string) => {
      const accessToken = await fetchAccessToken(code); // Fetch access token using authorisation code
      if (accessToken) {
        setToken(accessToken); // Set token state
      }
    };

    const handleAuth = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code"); // Get authorisation code from URL

      if (code) {
        window.history.replaceState({}, document.title, "/"); // Remove code from URL
        fetchToken(code); // Fetch token using the code
      } else if (localToken && tokenExpiryTime) {
        const now = new Date().getTime();
        if (now < parseInt(tokenExpiryTime)) {
          setToken(localToken); // Set token state if it's still valid
          setClientToken(localToken); // Set token for the API client
        } else {
          refreshAccessToken().then((accessToken) => {
            if (accessToken) {
              setToken(accessToken); // Refresh and set token
            } else {
              handleLogout(); // Logout if token refresh fails
            }
          });
        }
      }
    };

    handleAuth(); // Call the handleAuth function to manage authentication
  }, []);

  // Effect to fetch user's Spotify product (Free/Premium)
  useEffect(() => {
    const fetchUserProduct = async () => {
      if (token) {
        const product = await getUserProduct(token); // Fetch user product
        setUserProduct(product); // Set user product state
      }
    };

    fetchUserProduct(); // Call the function to fetch user product
  }, [token]);

  // Function to initialise an instance of Spotify Web Playback SDK for the player
  const initialiseSpotifyPlayer = () => {
    // If clause for error handling when the instance has not been initialised
    if (!window.Spotify || !window.Spotify.Player) {
      console.error("Spotify Player SDK not available.");
      return;
    }

    const player = new window.Spotify.Player({
      name: "Aero Shuffle",
      getOAuthToken: (cb) => {
        cb(token); // Provide token to the player
      },
      volume: 0.5,
    });

    player.addListener("ready", ({ device_id }) => {
      console.log("Ready with Device ID", device_id);
      setDeviceId(device_id); // Set device ID state
      setSdkWebPlayer(player); // Set web player state
    });

    player.addListener("not_ready", ({ device_id }) => {
      console.log("Device ID has gone offline", device_id);
    });

    player.addListener("initialization_error", ({ message }) => {
      console.error("Initialization Error:", message);
    });

    player.addListener("authentication_error", ({ message }) => {
      console.error("Authentication Error:", message);
    });

    player.addListener("account_error", ({ message }) => {
      console.error("Account Error:", message);
    });

    player.addListener("player_state_changed", (state) => {
      console.log("Player State Changed:", state);
    });

    player.connect().then((success) => {
      if (success) {
        console.log("Spotify Player connected successfully.");
      } else {
        console.error("Spotify Player connection failed.");
      }
    });
  };

  // Function to check if the token is valid
  const isTokenValid = () => {
    // Retrieve the token expiry time from local storage
    const tokenExpiryTime = window.localStorage.getItem("tokenExpiry");
    if (!tokenExpiryTime) return false; // If there is no token expiry time stored, return false
    const now = new Date().getTime(); // Get the current time in milliseconds
    // Check if the current time is less than the stored token expiry time
    // If it is, the token is still valid and the function returns true
    // Otherwise, the token is expired and the function returns false
    return now < parseInt(tokenExpiryTime);
  };

  // useEffect to initialise the Spotify player and manage token refresh
  useEffect(() => {
    if (!isTokenValid()) {
      handleLogout(); // Logout if token is not valid
    } else if (token) {
      window.onSpotifyWebPlaybackSDKReady = initialiseSpotifyPlayer; // Initialise player when SDK is ready
      initialiseSpotifyPlayer(); // Initialise player immediately
    }

    // Set up periodic token refresh check
    const tokenCheckInterval = setInterval(async () => {
      const now = new Date().getTime();
      const tokenExpiryTime = window.localStorage.getItem("tokenExpiry");
      if (tokenExpiryTime && now > parseInt(tokenExpiryTime) - 5 * 60 * 1000) {
        // Refresh token 5 minutes before it expires
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken); // Refresh token
        } else {
          handleLogout(); // Logout if token refresh fails
        }
      }
    }, token_check_interval);

    return () => clearInterval(tokenCheckInterval); // Clear interval on unmount
  }, [token]);

  // useEffect to fetch user's profile image
  useEffect(() => {
    if (token) {
      apiClient.get("me").then((response) => {
        setImage(response.data.images[0].url); // Set profile image
      });
    }
  }, [token]);

  // useEffect to fetch username
  useEffect(() => {
    if (token) {
      apiClient.get("me").then((response) => {
        setUsername(response.data.display_name); // Set username
      });
    }
  }, [token]);

  // Function to handle logout
  const handleLogout = () => {
    // Disconnect the player instance if there is one
    if (sdkWebPlayer) {
      try {
        sdkWebPlayer.disconnect();
        console.log("Spotify Player disconnected before logging out");
      } catch (error) {
        console.error("Error disconnecting Spotify Player:", error);
      }
    }

    // Remove token and token details on logout
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("tokenExpiry");
    window.localStorage.removeItem("refresh_token");

    // Reset token and user details
    setToken("");
    setImage("src/assets/images/sprites/profile-picture.png");
    setUsername("user");
  };

  // Function to handle login
  const handleLogin = async () => {
    const loginEndpoint = await getLoginEndpoint();
    window.location.href = loginEndpoint; // Redirect to login endpoint
  };

  return (
    <PlaybackProvider>
      <AlbumPlaylistProvider>
        <UserSearchCategoryProvider>
          <ContextMenuProvider>
            <div className="flex items-center justify-center h-screen overflow-hidden">
              <div className="window active glass opacity-90 w-full h-full">
                <Topbar />
                <div className="window-body bg-cover h-5/6">
                  {!token ? (
                    <div className="h-full w-full flex justify-center items-center relative">
                      <Login onLogin={handleLogin} />
                    </div>
                  ) : (
                    <Router>
                      <div className="h-full flex">
                        <Sidebar
                          onPlay={setPlaylistId}
                          sidebarOpen={sidebarOpen}
                          sidebarClose={setSidebarOpen}
                        />
                        <MainInterface
                          sidebarOpen={sidebarOpen}
                          sidebarClose={setSidebarOpen}
                        >
                          <Userbar
                            image={image}
                            username={username}
                            handleLogout={handleLogout}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                          />
                          <Routes>
                            <Route
                              index
                              element={
                                <Home
                                  onPlay={setPlaylistId}
                                  onArtistPlay={setTopTracks}
                                  onTrackPlay={setTrackUris}
                                />
                              }
                            />
                            <Route
                              path="/library"
                              element={<Library onPlay={setPlaylistId} />}
                            />
                            <Route
                              path="/liked-songs"
                              element={
                                <LikedSongs
                                  onPlay={setLikedSongs}
                                  onTrackPlay={setTrackUris}
                                />
                              }
                            />
                            <Route
                              path="/playlist/:id"
                              element={
                                <Playlist
                                  onPlay={setPlaylistId}
                                  onTrackPlay={setTrackUris}
                                />
                              }
                            />
                            <Route
                              path="/album/:id"
                              element={
                                <Album
                                  onPlay={setAlbumId}
                                  onTrackPlay={setTrackUris}
                                />
                              }
                            />
                            <Route
                              path="/artist/:id"
                              element={
                                <Artist
                                  onPlay={setTopTracks}
                                  onAlbumPlay={setAlbumId}
                                  onTrackPlay={setTrackUris}
                                />
                              }
                            />
                            <Route
                              path="/search"
                              element={
                                <Search
                                  onTrackPlay={setTrackUris}
                                  onPlaylistPlay={setPlaylistId}
                                  onAlbumPlay={setAlbumId}
                                  onArtistPlay={setTopTracks}
                                />
                              }
                            />
                            <Route
                              path="/category/:id"
                              element={
                                <Category onPlaylistPlay={setPlaylistId} />
                              }
                            />
                          </Routes>
                        </MainInterface>
                      </div>
                      <Player
                        playlistId={playlistId}
                        albumId={albumId}
                        likedSongs={likedSongs || []}
                        trackUris={trackUris}
                        topTracks={topTracks || []}
                        token={token}
                        deviceId={deviceId}
                        sdkWebPlayer={sdkWebPlayer}
                        userProduct={userProduct}
                      />
                    </Router>
                  )}
                </div>
              </div>
            </div>
          </ContextMenuProvider>
        </UserSearchCategoryProvider>
      </AlbumPlaylistProvider>
    </PlaybackProvider>
  );
}
