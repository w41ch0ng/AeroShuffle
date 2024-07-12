import { useEffect, useCallback, useState } from "react";
import { usePlayback } from "../contexts/PlayBackContext";
import apiClient from "../spotify";
import { Track } from "../interfaces";
//import rainSounds from "../assets/sfx/rain-sound.mp3";
import playButton from "../assets/images/sprites/play-button.png";
import pauseButton from "../assets/images/sprites/pause-button.png";
import shuffleButton from "../assets/images/sprites/shuffle-button.png";
import loopButton from "../assets/images/sprites/loop-button-2.png";
import rewindButton from "../assets/images/sprites/rewind-pressed-button.png";
import fastForwardButton from "../assets/images/sprites/fast-forward-pressed-button.png";
import volumeIcon from "../assets/images/sprites/274.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import PopupMessage from "./PopupMessage";

interface PlayerProps {
  playlistId: string | null;
  albumId: string | null;
  trackUris?: string[] | null;
  token: string;
  deviceId: string | null;
  sdkWebPlayer: Spotify.Player | null;
  likedSongs: Track[] | null;
  topTracks: Track[] | null;
  userProduct: string | null;
}

export default function Player({
  playlistId,
  albumId,
  trackUris,
  token,
  deviceId,
  sdkWebPlayer,
  likedSongs,
  topTracks,
  userProduct,
}: PlayerProps) {
  const {
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    tracks,
    setTracks,
    positionMs,
    setPositionMs,
    volume,
    setVolume,
    isShuffle,
    setIsShuffle,
    shuffledTracks,
    setShuffledTracks,
    repeatMode,
    setRepeatMode,
  } = usePlayback();
  const isPremiumUser = userProduct === "premium"; // Check if the user is a premium user
  // State to check if the current track is in liked songs
  const [inLikedSongs, setInLikedSongs] = useState<boolean>(false);
  // State for rendering messages when the user adds/removes a track to/from their liked songs
  const [likedSongMessage, setLikedSongMessage] = useState<string | null>(null);

  /* const [isRainPlaying, setIsRainPlaying] = useState(false);
  const [rainAudio] = useState(() => {
    const audio = new Audio(rainSounds);
    audio.loop = true;
    return audio;
  }); */

  // useEffect to get and set playlist tracks when playlistId changes
  useEffect(() => {
    if (playlistId) {
      apiClient
        //Make request to get playlist tracks using the playlistId
        .get(`playlists/${playlistId}/tracks`)
        .then((response) => {
          /* Set fetched tracks in a constant to filter out null values, map the tracks out,
          and use them to set the tracks and currentTrack states*/
          const fetchedTracks = response.data.items
            .filter((item: { track: Track | null }) => item.track !== null)
            .map((item: { track: Track }) => item.track);
          setTracks(fetchedTracks);
          setCurrentTrack(fetchedTracks[0] || null);
          /* Then, check to confirm the player has been initialised and that there are
          fetched tracks. If both are true, call playAndQueue tracks to queue and play the tracks */
          if (deviceId && fetchedTracks.length > 0) {
            playAndQueueTracks(fetchedTracks.map((track: Track) => track.uri));
          }
        })
        .catch((error) => console.error("API Error:", error));
    }
  }, [playlistId, deviceId, setCurrentTrack, setTracks]);

  // useEffect to get and set album tracks when albumId changes
  useEffect(() => {
    if (albumId) {
      apiClient
        //Make request to get playlist tracks using the albumId
        .get(`albums/${albumId}`)
        .then((response) => {
          // Set fetched tracks in a constant to use them to set the tracks and currentTrack states
          const fetchedTracks = response.data.tracks.items;
          setTracks(fetchedTracks);
          setCurrentTrack(fetchedTracks[0] || null);
          /* Then, check to confirm the player has been initialised and that there are
          fetched tracks. If both are true, call playAndQueue tracks to queue and play the tracks */
          if (deviceId && fetchedTracks.length > 0) {
            playAndQueueTracks(fetchedTracks.map((track: Track) => track.uri));
          }
        })
        .catch((error) => console.error("API Error:", error));
    }
  }, [albumId, deviceId, setCurrentTrack, setTracks]);

  // useEffect to get and set liked songs when likedSongs changes
  useEffect(() => {
    // Check to see whether there are liked songs when the user clicks play in the liked songs page
    if (likedSongs && likedSongs.length > 0) {
      // If there are, set the tracks state to the liked songs array and current track to null
      setTracks(likedSongs);
      setCurrentTrack(null);
      /* Then, call the playAndQueueTracks function to queue and play the liked songs by mapping out 
      the liked songs array */
      if (deviceId) {
        playAndQueueTracks(likedSongs.map((track) => track.uri));
      }
    }
  }, [likedSongs, deviceId, setCurrentTrack, setTracks]);

  // useEffect to get and set top tracks when topTracks changes
  useEffect(() => {
    // Check to see whether there are top tracks when the user clicks play on an artist's top tracks
    if (topTracks && topTracks.length > 0) {
      // If there are, set the tracks state to the top tracks array and current track to null
      setTracks(topTracks);
      setCurrentTrack(null);
      /* Then, call the playAndQueueTracks function to queue and play the top tracks by mapping out 
      the top tracks array */
      if (deviceId) {
        playAndQueueTracks(topTracks.map((track) => track.uri));
      }
    }
  }, [topTracks, deviceId, setCurrentTrack, setTracks]);

  // useEffect to set and play tracks when trackUris changes
  useEffect(() => {
    /* Check to see whether there is a track when the user clicks play on a track. This is mainly used
    for single tracks but as the tracks state takes an array, the same structure has been maintained */
    if (trackUris && trackUris.length > 0) {
      // If there are, set the tracks state to the trackUri (array) and current track to null
      setTracks([]);
      setCurrentTrack(null);
      // Then, call the playAndQueueTracks function to queue and play the track
      if (deviceId) {
        playAndQueueTracks(trackUris);
      }
    }
  }, [trackUris, deviceId, setCurrentTrack, setTracks]);

  // useEffect to handle shuffle mode
  useEffect(() => {
    // If playback is shuffled, use shuffleArray to shuffle the tracks
    if (isShuffle) {
      setShuffledTracks(shuffleArray([...tracks]));
    } else {
      /* If playback is not shuffled, set the tracks normally. */
      setShuffledTracks(tracks);
    }
  }, [isShuffle, tracks]);

  // Handle skip forward action
  const handleSkipForward = useCallback(() => {
    // Check for the player instance and if there are any shuffled tracks
    if (deviceId && shuffledTracks.length > 0) {
      // Find the index of the current track in the shuffled tracks array
      const currentIndex = shuffledTracks.findIndex(
        (track) => track.id === currentTrack?.id
      );
      // Calculate the index of the next track by +1
      const nextIndex = currentIndex + 1;

      // If the next index is beyond the end of the array (last track), stop playback
      if (nextIndex >= shuffledTracks.length) {
        setIsPlaying(false);
        return;
      }

      // Get the URI of the next track
      const nextTrackUri = shuffledTracks[nextIndex].uri;

      // Send a request to the API to play the next track
      apiClient
        .put(
          `me/player/play?device_id=${deviceId}`,
          {
            uris: [nextTrackUri],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        // If the request is successful, update the current track and playback states
        .then(() => {
          setCurrentTrack(shuffledTracks[nextIndex]);
          setIsPlaying(true);
        })
        .catch((error) => console.error("Skip Forward Error:", error.response));
    }
  }, [deviceId, shuffledTracks, currentTrack, setCurrentTrack, setIsPlaying]);

  // Handle skip back action
  const handleSkipBack = () => {
    if (!currentTrack) return; // If there is no current track, do nothing

    // Find the index of the current track in the shuffled tracks array
    const currentIndex = shuffledTracks.findIndex(
      (track) => track.id === currentTrack.id
    );

    /* If the current playback position is greater than 3s, make an API request to
  seek to the start of the track */
    if (positionMs > 3000) {
      apiClient
        .put(
          `me/player/seek?position_ms=0&device_id=${deviceId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        // If the request is successful, reset the playback position
        .then(() => {
          setPositionMs(0);
        })
        .catch((error) => console.error("Seek Error:", error.response));
    } else if (currentIndex > 0) {
      // If the current playback position is less than 3s and there is a previous track, play the previous track
      const previousIndex = currentIndex - 1;
      const previousTrackUri = shuffledTracks[previousIndex].uri;

      apiClient
        .put(
          `me/player/play?device_id=${deviceId}`,
          {
            uris: [previousTrackUri],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        // If the request is successful, update the current track and playback states
        .then(() => {
          setCurrentTrack(shuffledTracks[previousIndex]);
          setIsPlaying(true);
        })
        .catch((error) => console.error("Skip Back Error:", error.response));
    }
  };

  // useEffect to handle player state changes
  useEffect(() => {
    // Check for the player instance
    if (sdkWebPlayer) {
      // Function to handle player state changes
      const handlePlayerStateChange = (state: Spotify.PlaybackState) => {
        if (state) {
          // If the player state is available
          // Update the playback state (playing/paused)
          setIsPlaying(!state.paused);
          // Get the current track from the player state
          const currentTrack = state.track_window
            .current_track as unknown as Track;
          // Set both the currentTrack and positionMs states to the current track and playback position
          setCurrentTrack(currentTrack);
          setPositionMs(state.position);

          // Find the index of the current track in the track list
          const currentIndex = tracks.findIndex(
            (track) => track.id === state.track_window.current_track.id
          );
          // Create a list of the next tracks by slicing the track list
          const nextTracks = tracks
            .slice(currentIndex + 1)
            .concat(tracks.slice(0, currentIndex));

          // If shuffle mode is enabled, shuffle the next tracks
          if (isShuffle) {
            const shuffledTracks = shuffleArray(nextTracks);
            state.track_window.next_tracks = shuffledTracks.map((track) => ({
              ...track,
              uri: track.uri,
            }));
          } else {
            // Otherwise, use the next tracks in order
            state.track_window.next_tracks = nextTracks.map((track) => ({
              ...track,
              uri: track.uri,
            }));
          }

          // Handle different track playback cases
          if (state.paused && state.position === 0) {
            // If there are no more tracks in the queue, log a message (do nothing)
            if (state.track_window.next_tracks.length === 0) {
              console.log("Track ended, no more tracks in queue");
            } else if (currentIndex < tracks.length - 1) {
              // If there are more tracks, skip to the next track
              handleSkipForward();
            } else {
              // If there are no more tracks, stop playback
              setIsPlaying(false);
            }
          }
        }
      };

      // Add a listener for player state changes
      sdkWebPlayer.addListener("player_state_changed", handlePlayerStateChange);

      // Cleanup the listener when the component unmounts
      return () => {
        sdkWebPlayer.removeListener(
          "player_state_changed",
          handlePlayerStateChange
        );
      };
    }
  }, [
    sdkWebPlayer,
    setIsPlaying,
    setCurrentTrack,
    setPositionMs,
    tracks,
    handleSkipForward,
  ]);

  // useEffect to track the playback position
  useEffect(() => {
    // Declare a variable to hold the interval ID
    let interval: NodeJS.Timeout;

    // If playback is active, start an interval to update the position every second
    if (isPlaying) {
      interval = setInterval(() => {
        setPositionMs(positionMs + 1000);
      }, 1000);
    }

    // Cleanup the interval when the component unmounts or playback stops
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, positionMs, setPositionMs]);

  // Function to play and queue tracks by sending the tracks to the player endpoint
  const playAndQueueTracks = (trackUris: string[]) => {
    // Check for the player instance
    if (deviceId) {
      // Make a request to play the specific tracks by passing the trackUris
      apiClient
        .put(
          `me/player/play?device_id=${deviceId}`,
          {
            uris: trackUris,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        // If the request is successful, set isPlaying state to true
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => console.error("Play or Queue Error:", error));
    }
  };

  // Function to play or resume playback using the track URI and playback position
  const playOrResumeTrack = (trackUri: string, positionMs: number = 0) => {
    // Check for the player instance
    if (deviceId) {
      /* Make a request to play the specific tracks by passing the trackUris and the
      position. Separate function for when resuming playback by requesting to play
      specific track at a specific position */
      apiClient
        .put(
          `me/player/play?device_id=${deviceId}`,
          {
            uris: [trackUri],
            position_ms: positionMs,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        // If the request is successful, set isPlaying state to true
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => console.error("Play Error:", error));
    }
  };

  // Function to handle playing playback
  const handlePlay = () => {
    // If a track is already playing, pause it. If not, play or resume
    if (isPlaying) {
      pauseTrack();
    } else {
      if (currentTrack) {
        playOrResumeTrack(currentTrack.uri, positionMs);
      }
    }
  };

  // Function to handle pausing playback
  const pauseTrack = () => {
    // Make an request to the API to pause playback and sets the isPlaying state to false
    if (deviceId) {
      apiClient
        .put(
          `me/player/pause?device_id=${deviceId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then(() => {
          setIsPlaying(false);
        })
        .catch((error) => console.error("Pause Error:", error));
    }
  };

  // Function to shuffle playback by shuffling the array of tracks sent to the player
  const shuffleArray = (array: Track[]) => {
    // Loop through the array from the last element to the second element
    for (let i = array.length - 1; i > 0; i--) {
      // Generate a random index between 0 and the current index (inclusive)
      const j = Math.floor(Math.random() * (i + 1));
      // Swap the current element with the element at the random index
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array; // Return the shuffled array
  };

  // Function for handling the shuffle request to the player
  const handleShuffle = () => {
    // Make an request to the API to shuffle playback and sets the isShuffle state to the isShuffle boolean
    if (deviceId) {
      apiClient
        .put(
          `me/player/shuffle?state=${!isShuffle}&device_id=${deviceId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then(() => {
          setIsShuffle(!isShuffle);
        })
        .catch((error) => console.error("Shuffle Error:", error));
    }
  };

  /* Function for handling switching the playback loop modes and making the loop 
  request to the player */
  const handleLoop = () => {
    if (!deviceId) return;

    /* Define a newRepeat mode and use a switch block to switch between the three loop modes to track
    and set the loop mode*/
    let newRepeatMode;
    switch (repeatMode) {
      case "off":
        newRepeatMode = "context";
        break;
      case "context":
        newRepeatMode = "track";
        break;
      case "track":
        newRepeatMode = "off";
        break;
      default:
        newRepeatMode = "off";
    }

    /* Use the chosen loop mode set with newRepeatMode to make an API request to set the repeat (loop) state 
    for the player and for the repeatMode state */
    apiClient
      .put(
        `me/player/repeat?state=${newRepeatMode}&device_id=${deviceId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then(() => {
        console.log(`Repeat mode set to ${newRepeatMode}`);
        setRepeatMode(newRepeatMode as "off" | "context" | "track");
      })
      .catch((error) => console.error("Repeat Error:", error));
  };

  /* Function for handling the volume bar. Handles the volume change and rendering the
  volume bar */
  const VolumeBar = () => {
    // Function to handle volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Parse the new volume value from user input
      const newVolume = parseInt(e.target.value);
      setVolume(newVolume); // Update the volume state with the chosen volume
      // Check for the player instance and set the volume for the player
      if (sdkWebPlayer) {
        sdkWebPlayer.setVolume(newVolume / 100).then(() => {
          console.log("Volume changed to", newVolume);
        });
      }
    };

    return (
      // Container for the volume bar
      <div className="relative w-full h-5">
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="absolute top-2 left-0 w-full h-1 opacity-0 z-10 cursor-pointer"
        />
        {/* Background bar */}
        <div className="absolute top-2 left-0 w-full h-1 bg-gray-300 rounded-full"></div>
        {/* Foreground bar showing the current volume level */}
        <div
          className="absolute top-2 left-0 h-1 bg-blue-500 rounded-full"
          style={{ width: `${volume}%` }}
        ></div>
      </div>
    );
  };

  /* Function for handling the seek bar. Handles the seek bar and track position
  changes and rendering the seek bar */
  const SeekBar = () => {
    // Function to handle seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Parse the new position value from user input
      const newPosition = parseInt(e.target.value);
      setPositionMs(newPosition); // Update the playback position state with the chosen position
      // Check for the player instance and set the position in the player
      if (sdkWebPlayer) {
        sdkWebPlayer.seek(newPosition).then(() => {
          console.log("Seeked to", newPosition);
        });
      }
    };

    return (
      <div className="relative w-full h-5">
        {/* Input range for adjusting the playback position */}
        <input
          type="range"
          min="0"
          max={currentTrack ? currentTrack.duration_ms : 0}
          value={positionMs}
          onChange={handleSeek}
          className="absolute top-2 left-0 w-full h-1 opacity-0 z-10 cursor-pointer"
        />
        {/* Background bar */}
        <div className="absolute top-2 left-0 w-full h-1 bg-gray-300 rounded-full"></div>
        {/* Foreground bar showing the current playback position */}
        <div
          className="absolute top-2 left-0 h-1 bg-blue-500 rounded-full"
          style={{
            width: `${
              currentTrack ? (positionMs / currentTrack.duration_ms) * 100 : 0
            }%`,
          }}
        ></div>
      </div>
    );
  };

  /* const toggleRainSound = () => {
    if (isRainPlaying) {
      rainAudio.pause();
    } else {
      rainAudio.play();
    }
    setIsRainPlaying(!isRainPlaying);
  }; */

  // useEffect with getter and setter to check if a track is in the user's liked songs
  useEffect(() => {
    // Function to fetch liked songs
    const fetchLikedSongs = async () => {
      // If there is a current track
      if (currentTrack) {
        try {
          // Make a request to check if the current track is in the user's liked songs
          const response = await apiClient.get("me/tracks/contains", {
            params: { ids: currentTrack?.id },
          });
          // Update the state to indicate whether the track is in liked songs
          setInLikedSongs(response.data[0]);
        } catch (error) {
          console.error("API Error: ", error);
        }
      }
    };

    // Call the function to fetch liked songs
    fetchLikedSongs();
  }, [currentTrack]);

  // Function to handle adding a track to the user's liked songs in the player
  const handleAddToLikedSongs = async () => {
    if (!currentTrack) return; // If there is no current track, do nothing

    try {
      // Make a request to add the current track to the user's liked songs
      await apiClient.put(
        "me/tracks",
        { ids: [currentTrack.id] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Update the state to indicate the track is in liked songs
      setInLikedSongs(true);
      // Display a message indicating the track was added to liked songs
      setLikedSongMessage("Added to Liked Songs");
      // Clear the message after 2s
      setTimeout(() => setLikedSongMessage(null), 2000);
    } catch (error) {
      console.error("Error adding track to liked songs:", error);
    }
  };

  // Function to handle removing a track from the user's liked songs in the player
  const handleRemoveFromLikedSongs = async () => {
    if (!currentTrack) return; // If there is no current track, do nothing

    try {
      // Make a request to remove the current track from the user's liked songs
      await apiClient.delete("me/tracks", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { ids: [currentTrack.id] },
      });
      // Update the state to indicate the track is not in liked songs
      setInLikedSongs(false);
      // Display a message indicating the track was removed from liked songs
      setLikedSongMessage("Removed from Liked Songs");
      // Clear the message after 2 seconds
      setTimeout(() => setLikedSongMessage(null), 2000);
    } catch (error) {
      console.error("Error removing track from liked songs:", error);
    }
  };

  /* const updatePlaybackQueue = () => {
    if (sdkWebPlayer) {
      sdkWebPlayer.getCurrentState().then((playerState) => {
        if (playerState) {
          const currentIndex = tracks.findIndex(
            (track) => track.id === playerState.track_window.current_track.id
          );
          let nextTracks = tracks
            .slice(currentIndex + 1)
            .concat(tracks.slice(0, currentIndex));

          if (playerState.shuffle || isShuffle) {
            nextTracks = shuffleArray(nextTracks);
          }

          playerState.track_window.next_tracks = nextTracks.map((track) => ({
            ...track,
            uri: track.uri,
          }));
        }
      });
    }
  }; */

  return (
    <div className="player h-[calc(16.66%-32px)] flex flex-col sm:flex-row justify-between items-center p-3 sm:pt-7">
      <div className="w-1/2 sm:w-1/4 hidden sm:flex items-center">
        {currentTrack ? (
          <>
            <div className="flex-shrink-0 w-16 h-16 mr-4">
              <img
                src={currentTrack.album?.images[0]?.url}
                alt={currentTrack.name}
                className="w-full h-full hidden sm:block"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-white font-bold text-base tracking-wider">
                {currentTrack.name}
              </span>
              <span className="truncate text-slate-300 text-base tracking-wide">
                {currentTrack.artists.map((artist) => artist.name).join(", ")}
              </span>
            </div>
          </>
        ) : (
          <div></div>
        )}
      </div>
      <div className="playback-seekbar relative justify-center sm:px-8 sm:pt-6 items-center space-x-3 sm:space-y-1 space-y-2">
        {isPremiumUser ? (
          <div className="flex justify-center items-center rounded-full bg-wmp-blue px-4">
            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className=""
            >
              <img
                src={spotifyLogo}
                alt="Spotify Logo"
                className="w-7 h-7 mr-2"
              />
            </a>
            <img
              onClick={handleShuffle}
              src={shuffleButton}
              className="w-4 h-4  hover:cursor-pointer hover:brightness-125"
            />
            <img
              onClick={handleSkipBack}
              src={rewindButton}
              className="md:w-[55px] w-[55px] sm:w-10 h-[25px] hover:cursor-pointer hover:brightness-125"
            />
            <img
              onClick={handlePlay}
              src={isPlaying ? pauseButton : playButton}
              className="md:w-12 md:h-12 w-12 h-12 sm:w-9 sm:h-9 hover:cursor-pointer hover:brightness-125"
            />
            <img
              onClick={handleSkipForward}
              src={fastForwardButton}
              className="md:w-[55px] w-[55px] sm:w-10 h-[25px] hover:cursor-pointer hover:brightness-125"
            />
            <img
              onClick={handleLoop}
              src={loopButton}
              className="w-4 h-4 hover:cursor-pointer hover:brightness-125"
            />
            {/* <i
              onClick={toggleRainSound}
              className="fa-solid fa-cloud-rain text-2xl text-blue-300 px-2 py-2 hover:cursor-pointer"
            ></i> */}
            {inLikedSongs ? (
              <i
                className="fa-solid fa-heart text-2xl text-gray-600 px-2 py-2 hover:cursor-pointer"
                onClick={handleRemoveFromLikedSongs}
              ></i>
            ) : (
              <i
                className="fa-regular fa-heart text-2xl text-gray-600 px-2 py-2 hover:cursor-pointer"
                onClick={handleAddToLikedSongs}
              ></i>
            )}
          </div>
        ) : (
          <div className="text-white font-bold">
            Sign in with a{" "}
            <a
              href="https://www.spotify.com/uk/premium/"
              className="text-white font-bold"
            >
              premium account
            </a>{" "}
            to access playback.
            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 ml-4 md:ml-0"
            >
              <img src={spotifyLogo} alt="Spotify Logo" className="w-5 h-5" />
              <span className="text-white font-bold text-xs tracking-wide ml-1">
                Open Spotify
              </span>
            </a>
          </div>
        )}
        <PopupMessage
          message={likedSongMessage || ""}
          isVisible={likedSongMessage !== null}
        />
        <div>
          <SeekBar />
        </div>
      </div>
      <div className="hidden sm:flex sm:w-1/4 items-center mb-5 sm:mb-0">
        <img src={volumeIcon} className="pr-4 w-12 h-10" />
        <div className="w-5/6 float-end">
          <VolumeBar />
        </div>
      </div>
    </div>
  );
}
