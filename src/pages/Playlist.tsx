import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { useContextMenu } from "../contexts/ContextMenuContext";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";
import ContextMenu from "../components/ContextMenu";
import EditPlaylistModal from "../components/EditPlaylistModal";
import { Playlist, SearchResult, Track, PlaylistTrack } from "../interfaces";
import defaultPlaylistImage from "../assets/images/backgrounds/w7-wallpaper.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import playButton from "../assets/images/sprites/play-button.png";
import explicitIcon from "../assets/images/sprites/explicit.png";
import he from "he";
import parse, { HTMLReactParserOptions, Element } from "html-react-parser";

interface PlaylistProps {
  onPlay: (id: string) => void;
  onTrackPlay: (uris: string[]) => void;
}

export default function PlaylistPage({ onPlay, onTrackPlay }: PlaylistProps) {
  const { id } = useParams<{ id: string }>();
  const { userId, setUserId, query, setQuery, results, setResults } =
    useUserSearchCategory();
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
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const {
    playlist,
    setPlaylist,
    playlists,
    setPlaylists,
    setTopTracks,
    isFollowing,
    setIsFollowing,
    recommendedTracks,
    setRecommendedTracks,
  } = useAlbumPlaylist();
  const navigate = useNavigate();
  /* isOwner const which sets the playlist ownership based on the 
  playlist's 'owner.id' value; if it matches the user's ID, the isOwner value can
  be set to true as the user is the owner and so the functionality based on if the
  user is the owner of the playlist can be conditionally rendered */
  const isOwner = userId === playlist?.owner.id;

  /* useEffect which fetches playlist and recommended tracks when the playlist ID changes
  and to fetch the user's playlists. Separated the fetchPlaylists from the function
  as fetchPlaylists needs to be called multiple times */
  useEffect(() => {
    const fetchPlaylistAndRecommendedTracks = async () => {
      try {
        setPlaylist(null); // Reset the playlist state to null while loading
        // Fetch playlist and user data concurrently using Promise.all
        const [playlistResponse, userResponse] = await Promise.all([
          apiClient.get<Playlist>(`playlists/${id}`),
          apiClient.get("me"),
        ]);
        const playlistData = playlistResponse.data; // Extract playlist data from the response
        const user = userResponse.data; // Extract user data from the response

        // If the playlist has no images, use a default image
        if (!playlistData.images || playlistData.images.length === 0) {
          playlistData.images = [{ url: defaultPlaylistImage }];
        }

        setPlaylist(playlistData); // Update the playlist state with fetched data
        setUserId(user.id); // Update the userId state with the user's ID

        // Fetch the user's playlists to determine if they follow the current playlist
        const playlistsResponse = await fetchPlaylists();
        const followedPlaylistIds = playlistsResponse.map(
          (pl: Playlist) => pl.id // Map the playlists to their IDs
        );
        setIsFollowing(followedPlaylistIds.includes(id)); // Check if the user follows the current playlist

        // Fetch recommended tracks only if user is owner
        if (userId === playlistData.owner.id) {
          fetchRecommendedTracks(playlistData.tracks.items); // Fetch recommended tracks based on the playlist's tracks
        }
      } catch (error) {
        console.error("API Error:", error);
      }
    };

    fetchPlaylistAndRecommendedTracks();
  }, [userId, id]); // Rerun the effect whenever the playlist ID changes

  /* useEffect which holds fetching search results based on the search query typed
   into the add tracks search bar with a debounce */
  useEffect(() => {
    if (query && query.length > 0) {
      // Check if there is a query and it is not empty
      const fetchResults = async () => {
        // Asynchronous function to fetch search results
        try {
          const response = await apiClient.get<SearchResult>( // Make a GET request to the search API
            `search?q=${query}&type=track&limit=5` // Construct the search URL with the query and limit to 5 results
          );
          setResults(response.data.tracks.items); // Update the results state with the fetched track items
        } catch (error) {
          console.error("Search API Error:", error);
        }
      };

      const debounce = setTimeout(fetchResults, 300); // Set a timeout to debounce the search by 300 milliseconds
      return () => clearTimeout(debounce); // Clear the timeout if the effect is cleaned up or rerun
    } else {
      setResults([]); // If the query is empty, clear the results
    }
  }, [query]); // Rerun the effect whenever the query changes

  /* Fetch recommended tracks based on the playlist's current tracks or user's top 
  tracks if there are no tracks in the playlist already */
  const fetchRecommendedTracks = async (playlistTracks: PlaylistTrack[]) => {
    try {
      let seedTracks: string[] = []; // Initialise an array to hold seed track IDs

      // If the playlist has tracks, use up to 5 of them as seed tracks
      if (playlistTracks.length > 0) {
        seedTracks = playlistTracks
          .slice(0, 5) // Take the first 5 tracks from the playlist
          .map((item: PlaylistTrack) => item.track.id); // Map the tracks to their IDs
      } else {
        /* If the playlist has no tracks, use the user's top tracks as seed tracks
        Make a GET request to get the user's top tracks*/
        const topTracksResponse = await apiClient.get("me/top/tracks", {
          params: { limit: 5 }, // Limit the number of top tracks to 5
        });
        const topTracksData = topTracksResponse.data.items; // Extract the top tracks data from the response
        setTopTracks(topTracksData); // Update the state with the user's top tracks
        seedTracks = topTracksData.map((track: Track) => track.id); // Map the top tracks to their IDs
      }

      /* Fetch recommended tracks based on the seed tracks
    Make a GET request to get recommendations from the API*/
      const recommendationsResponse = await apiClient.get("recommendations", {
        params: {
          seed_tracks: seedTracks.join(","), // Join the seed track IDs into a comma-separated string
          limit: 12, // Limit the number of recommended tracks to 12
        },
      });
      const recommendedTracksData = recommendationsResponse.data.tracks; // Extract the recommended tracks data from the response
      setRecommendedTracks(recommendedTracksData); // Update the state with the recommended tracks
    } catch (error) {
      console.error("Error fetching recommended tracks:", error);
    }
  };

  /* Function to fetch the user's playlists. useCallback is used as the function is
  needed for both the useEffect to get the user's playlists on component mount and for
  other functions for playlists */
  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await apiClient.get("me/playlists");
      const fetchedPlaylists = response.data.items;
      setPlaylists(fetchedPlaylists);
      return fetchedPlaylists;
    } catch (error) {
      console.error("Error fetching playlists:", error);
      return [];
    }
  }, [setPlaylists]);

  useEffect(() => {
    fetchPlaylists(); // Call fetchPlaylists on component mount
  }, [fetchPlaylists]);

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

  /* Function to delete the playlist by removing the user as a follower of that
  playlist; Spotify documentation states they do not support deletion, so deletion
  must be handled by removing the user as a follower */
  const handleDeletePlaylist = async () => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      try {
        // Make request to delete by removing the user as a follower of the playlist
        await apiClient.delete(`playlists/${id}/followers`);
        /* If deletion is successful, navigate the user back to the library and reset 
        playlists state*/
        navigate("/library");

        const playlists = await fetchPlaylists();
        if (playlists) {
          setPlaylists(playlists);
        }
      } catch (error) {
        console.error("Error deleting playlist:", error);
      }
    }
  };

  /* Function to follow a playlist the user is not the owner of by adding the user
  as a follower to the playlist */
  const handleFollowPlaylist = async () => {
    try {
      // Make request to follow by adding the user as a follower of the playlist
      await apiClient.put(`playlists/${id}/followers`);
      // Update the playlists state
      const playlists = await fetchPlaylists();
      if (playlists) {
        setPlaylists(playlists);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error following playlist:", error);
    }
  };

  /* Function to unfollow a playlist the user is not the owner of by removing the user
  as a follower from the playlist */
  const handleUnfollowPlaylist = async () => {
    try {
      // Make request to unfollow by removing the user as a follower of the playlist
      await apiClient.delete(`playlists/${id}/followers`);
      // Update the playlists state
      const playlists = await fetchPlaylists();
      if (playlists) {
        setPlaylists(playlists);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Error unfollowing playlist:", error);
    }
  };

  /* Function to add a track to the playlist the user is the owner of by getting the
  track ID and making a post request to the playlist */
  const handleAddTrackToPlaylist = async (trackId: string) => {
    try {
      // Make request to add track to playlist using track ID
      await apiClient.post(`playlists/${id}/tracks`, {
        uris: [`spotify:track:${trackId}`],
      });
      // Update the playlist by making a new request and updating the playlist state
      const updatedPlaylist = await apiClient.get<Playlist>(`playlists/${id}`);
      setPlaylist(updatedPlaylist.data);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  // Function for updating the playlist with the edit playlist modal
  const handleSavePlaylistDetails = async (
    updatedPlaylist: Partial<Playlist>, // Function receives updated playlist details and an optional image file
    imageFile: File | null
  ) => {
    try {
      if (imageFile) {
        // Check if an image file is provided
        const resizedImageFile = await resizeAndCompressImage(imageFile); // Resize and compress the image file

        const reader = new FileReader(); // Create a FileReader to read the image file as a base64 string
        reader.readAsDataURL(resizedImageFile); // Read the resized image file as a base64 data URL
        reader.onload = async () => {
          // Once the file is read
          const base64Image = reader.result?.toString().split(",")[1]; // Extract the base64 string from the data URL
          try {
            await apiClient.put(`playlists/${id}/images`, base64Image, {
              // Send a PUT request to upload the image
              headers: {
                "Content-Type": "image/jpeg", // Set the content type to image/jpeg
              },
            });
            await apiClient.put(`playlists/${id}`, updatedPlaylist); // Update the playlist details
            setPlaylist({ ...playlist!, ...updatedPlaylist }); // Update the state with the new playlist details
            setEditModalOpen(false); // Close the edit modal
          } catch (error) {
            console.error("Error uploading image or updating playlist:", error);
          }
        };
        reader.onerror = (error) => {
          // Handle any errors while reading the file
          console.error("FileReader error:", error);
        };
      } else {
        // If no image file is provided
        await apiClient.put(`playlists/${id}`, updatedPlaylist); // Update the playlist details without changing the image
        setPlaylist({ ...playlist!, ...updatedPlaylist }); // Update the state with the new playlist details
        setEditModalOpen(false); // Close the edit modal
      }
    } catch (error) {
      console.error("Error handling playlist details:", error);
    }
  };

  // Function for ensuring the image is formatted to Spotify's standards
  const resizeAndCompressImage = async (imageFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = new Image(); // Create a new Image object
      image.src = URL.createObjectURL(imageFile); // Set the image source to the object URL of the file
      image.onload = () => {
        // Once the image is loaded
        const canvas = document.createElement("canvas"); // Create a canvas element
        const context = canvas.getContext("2d")!; // Get the 2D rendering context for the canvas
        const maxWidth = 1024; // Set the maximum width for the resized image
        const maxHeight = 1024; // Set the maximum height for the resized image
        let width = image.width; // Get the original width of the image
        let height = image.height; // Get the original height of the image

        if (width > height) {
          // If the image is wider than it is tall
          if (width > maxWidth) {
            // If the width exceeds the maximum width
            height *= maxWidth / width; // Scale the height proportionally
            width = maxWidth; // Set the width to the maximum width
          }
        } else {
          // If the image is taller than it is wide
          if (height > maxHeight) {
            // If the height exceeds the maximum height
            width *= maxHeight / height; // Scale the width proportionally
            height = maxHeight; // Set the height to the maximum height
          }
        }

        canvas.width = width; // Set the canvas width
        canvas.height = height; // Set the canvas height

        context.drawImage(image, 0, 0, width, height); // Draw the image onto the canvas with the new dimensions

        canvas.toBlob(
          // Convert the canvas content to a Blob
          (blob) => {
            if (!blob) {
              // If the Blob conversion fails
              reject(new Error("Failed to resize image.")); // Reject the promise with an error
              return;
            }
            const resizedImage = new File([blob], imageFile.name, {
              // Create a new File object from the Blob
              type: "image/jpeg", // Set the file type to image/jpeg
            });
            resolve(resizedImage); // Resolve the promise with the resized image file
          },
          "image/jpeg", // Set the Blob type to image/jpeg
          0.7 // Set the quality of the JPEG compression
        );
      };
      image.onerror = (error) => reject(error); // Reject the promise if there is an error loading the image
    });
  };

  // Function to properly parse playlist descriptions containing links
  const parseDescription = (description: string) => {
    const options: HTMLReactParserOptions = {
      replace: (domNode) => {
        // Define the replace function for HTMLReactParser options
        if (domNode instanceof Element && domNode.name === "a") {
          // Check if the node is an anchor element
          const href = domNode.attribs.href; // Get the href attribute of the anchor element
          if (href.startsWith("spotify:playlist:")) {
            // Check if the href starts with "spotify:playlist:"
            const playlistId = href.replace("spotify:playlist:", ""); // Extract the playlist ID from the href
            return (
              <Link to={`/playlist/${playlistId}`}>
                {domNode.children[0].type ===
                "text" /* Return a Link component for the
                          playlist page taken from the href and check if the
                          first child of the anchor is a text node */
                  ? domNode.children[0].data // If it is, use its data as the link text
                  : ""}
              </Link>
            );
          }
        }
      },
    };
    return parse(description, options); // Parse the description using the defined options
  };

  if (!playlist) {
    return <div></div>;
  }

  return (
    <div className="h-[90%] w-full no-scrollbar overflow-y-auto relative">
      <div className="p-4">
        <div className="flex items-center w-[90%] overflow-x-scroll no-scrollbar">
          <div className="flex-shrink-0">
            <img
              src={playlist.images[0]?.url || defaultPlaylistImage}
              alt={playlist.name}
              className="w-32 h-32 mr-4"
            />
          </div>
          <div>
            <h1 className="text-3xl text-white font-bold tracking-wider">
              {playlist.name}
            </h1>
            <p className="text-gray-300 font-bold tracking-wider hidden sm:block">
              {parseDescription(he.decode(playlist.description))}
            </p>
            <div className="flex mt-2">
              {isOwner && (
                <>
                  <i
                    onClick={handleDeletePlaylist}
                    className="fa-solid fa-trash text-2xl text-white px-1 py-1 hover:cursor-pointer"
                  ></i>
                  <i
                    onClick={() => setEditModalOpen(true)}
                    className="fa-regular fa-pen-to-square text-2xl text-white px-1 py-1 hover:cursor-pointer"
                  ></i>
                </>
              )}
              {!isOwner && !isFollowing && (
                <i
                  onClick={handleFollowPlaylist}
                  className="fa-regular fa-plus text-2xl text-white px-1 py-1 hover:cursor-pointer"
                ></i>
              )}
              {!isOwner && isFollowing && (
                <i
                  onClick={handleUnfollowPlaylist}
                  className=" fa-regular fa-circle-check text-2xl text-white px-1 py-1 hover:cursor-pointer"
                ></i>
              )}
              {/* {isOwner && isPublic && (
                <>
                <i
                  onClick={handleUnfollowPlaylist}
                  className=" fa-solid fa-unlock text-2xl text-blue-300 px-2 py-2 hover:cursor-pointer"
                ></i>
                </>
              )}
              {isOwner && !isPublic && (
                <>
                <i
                  onClick={handleUnfollowPlaylist}
                  className=" fa-solid fa-lock text-2xl text-blue-300 px-2 py-2 hover:cursor-pointer"
                ></i>
                </>
              )} */}
              <img
                src={playButton}
                className="w-10 h-10 mx-1 hover:cursor-pointer hover:brightness-125"
                onClick={() => onPlay(playlist.id)}
              />
              <a
                href={`https://open.spotify.com/playlist/${id}`}
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
          {/* <div>
            <span>{playlist.isPublic ? "Public" : "Private"}</span>
          </div> */}
        </div>
        <div className="mt-4 md:overflow-x-auto no-scrollbar">
          <table className="min-w-full text-left text-sm text-white font-bold tracking-wider">
            <thead>
              <tr>
                <th className="hidden md:flex flex-row p-4">#</th>
                <th className="p-4">Title</th>
                <th className="p-4">Album</th>
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {playlist.tracks.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-white">
                    No tracks in this playlist.
                  </td>
                </tr>
              ) : (
                playlist.tracks.items
                  .filter((item) => item.track !== null)
                  .map((item, index) => {
                    const track = item.track;
                    return (
                      <tr
                        key={`${track?.id}-${index}`}
                        className="group hover:brightness-125"
                        onContextMenu={(e) =>
                          handleContextMenu(e, item.track.id, "track")
                        }
                      >
                        <td className="hidden md:table-cell p-4">
                          {index + 1}
                        </td>
                        <td className="p-4 flex items-center">
                          {track?.album.images[0].url && (
                            <img
                              src={track?.album.images[0].url}
                              alt={track?.name}
                              className="w-12 h-12 mr-4"
                            />
                          )}
                          <div>
                            <h3 className="text-white font-bold text-base tracking-wide">
                              {track?.name}
                            </h3>
                            <p className="text-gray-300">
                              {track?.artists.map((artist, index) => (
                                <span
                                  key={artist.id}
                                  className="hover:underline cursor-pointer"
                                  onClick={() => handleArtistClick(artist.id)}
                                >
                                  {artist.name}
                                  {index < track?.artists.length - 1
                                    ? ", "
                                    : ""}
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
                            handleAlbumClick(track?.album.id);
                          }}
                        >
                          {track?.album.name}
                        </td>
                        <td className="p-4">
                          {formatDuration(track?.duration_ms)}
                        </td>
                        <td className="p-4 text-right flex">
                          <img
                            src={playButton}
                            className="w-9 h-9 mx-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer"
                            onClick={() => onTrackPlay([track.uri])}
                          />
                          <span
                            onClick={(e) =>
                              handleContextMenu(e, track.id, "track")
                            }
                            className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
                          >
                            ...
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
        {isOwner && (
          <div className="flex flex-col form-group mt-4">
            <h2 className="text-2xl text-white font-bold tracking-wide mb-4">
              Add Tracks
            </h2>
            <input
              type="text"
              placeholder="Search for tracks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-4/5 p-2 rounded-lg self-center"
            />
            {results.length > 0 && (
              <ul className="search-results mt-4">
                {results.map((track, index) => (
                  <li
                    key={`${track.id}-${index}`}
                    className="mb-2 cursor-pointer"
                    onClick={() => handleAddTrackToPlaylist(track.id)}
                  >
                    <div className="flex items-center">
                      {track.album.images[0] && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-12 h-12 mr-4"
                        />
                      )}
                      <span className="text-white font-bold">{track.name}</span>
                      {track?.explicit && (
                        <img
                          src={explicitIcon}
                          alt="Explicit"
                          className="w-4 h-4 ml-2"
                          title="Explicit"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {isOwner && (
          <div className="w-full mt-4">
            <h2 className="text-xl text-white font-bold tracking-wide mb-4">
              Recommended Tracks
            </h2>
            {recommendedTracks.length === 0 ? (
              <p className="text-lg text-white">No recommended tracks found</p>
            ) : (
              <div className="flex flex-col space-y-4 overflow-y-auto h-60 no-scrollbar">
                {recommendedTracks.map((track: Track) => (
                  <div
                    key={track.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTrackToPlaylist(track.id);
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
          isOwner={isOwner}
          userPlaylists={playlists.filter(
            (playlist) => playlist.owner.id === userId
          )}
        />
      )}
      {editModalOpen && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSavePlaylistDetails}
        />
      )}
    </div>
  );
}
