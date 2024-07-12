import { useEffect, Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../spotify";
import { useContextMenu } from "../contexts/ContextMenuContext";
import ContextMenu from "../components/ContextMenu";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { useUserSearchCategory } from "../contexts/UserSearchCategoryContext";
import { SearchResult } from "../interfaces";
import defaultPlaylistImage from "../assets/images/backgrounds/w7-wallpaper.png";
import spotifyLogo from "../assets/images/sprites/Spotify_Icon_RGB_White.png";
import playButton from "../assets/images/sprites/play-button.png";
import explicitIcon from "../assets/images/sprites/explicit.png";
import { Track } from "../interfaces";

interface SearchProps {
  onTrackPlay: (uris: string[]) => void;
  onPlaylistPlay: (id: string) => void;
  onAlbumPlay: (id: string) => void;
  onArtistPlay: Dispatch<SetStateAction<Track[] | null>>;
}

export default function Search({
  onTrackPlay,
  onPlaylistPlay,
  onAlbumPlay,
  onArtistPlay,
}: SearchProps) {
  const {
    userId,
    setUserId,
    query,
    setQuery,
    searchResults,
    setSearchResults,
    categories,
    setCategories,
  } = useUserSearchCategory();
  const { playlists, setPlaylists, setArtistTopTracks } = useAlbumPlaylist();
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

  /* useEffect with getters and setters for user's playlists - for getting
  the user's playlists for the sidebar without page reload - and browse categories  */
  useEffect(() => {
    apiClient.get("me/playlists").then(function (response) {
      setPlaylists(response.data.items);
    });
    apiClient
      .get("browse/categories", { params: { limit: 15 } })
      .then(function (response) {
        setCategories(response.data.categories.items);
      });
  }, []);

  /* useEffect which holds fetching search results based on the search query typed
   into the search bar with a debounce */
  useEffect(() => {
    if (query.length > 0) {
      // Check if there is a query and it is not empty
      const fetchResults = async () => {
        // Asynchronous function to fetch search results
        try {
          const response = await apiClient.get<SearchResult>( // Make a GET request to the search API
            `search?q=${query}&type=artist,album,track,playlist&limit=5` // Construct the search URL with the query and limit to 5 results
          );
          setSearchResults(response.data); // Update the search results state with the fetched items

          const userResponse = await apiClient.get("me");
          setUserId(userResponse.data.id); // Get and set the userId
        } catch (error) {
          console.error("Search API Error:", error);
        }
      };

      const debounce = setTimeout(fetchResults, 300); // Set a timeout to debounce the search by 300 milliseconds
      return () => clearTimeout(debounce); // Clear the timeout if the effect is cleaned up or rerun
    } else {
      setSearchResults(null); // If the query is empty, clear the results
    }
  }, [query]); // Rerun the effect whenever the query changes

  // Function to get an artist's top tracks and start playing their top tracks
  const fetchArtistTopTracks = (id: string) => {
    // Make a request to get an artists top tracks using the artist ID
    apiClient.get(`artists/${id}/top-tracks?market=US`).then((response) => {
      setArtistTopTracks(response.data.tracks); // Update the artist top tracks state with the response
      onArtistPlay(response.data.tracks); // Play the artist's top tracks
    });
  };

  // Navigate to an artist's page
  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  // Navigate to an album's page
  const handleAlbumClick = (albumId: string) => {
    navigate(`/album/${albumId}`);
  };

  // Navigate to a playlist's page
  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  // Navigate to a category's page
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
  };

  {
    /* const handleTrackPlay = (uri: string) => {
    onTrackPlay([uri]);
  }; */
  }

  return (
    <div className="search-page h-[90%] w-full no-scrollbar overflow-y-auto">
      <div className="p-4 relative">
        <input
          type="text"
          placeholder="Search for artists, tracks, albums or playlists"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-bar w-[60%] md:w-4/5 p-2 rounded-lg"
        />
        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-2 top-2 h-5 flex items-center justify-center text-center rounded-full border-2 py-4 px-2 ml-4 md:ml-0 hover:no-underline"
        >
          <img src={spotifyLogo} alt="Spotify Logo" className="w-5 h-5" />
          <span className="text-white font-bold text-xs tracking-wide ml-1">
            Open Spotify
          </span>
        </a>
        {!query && (
          <div className="categories-grid grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-item flex flex-col items-center cursor-pointer"
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
        )}
        {searchResults && (
          <div className="search-results mt-4">
            {searchResults.artists.items.length > 0 && (
              <div className="artists-section mb-4">
                <h2 className="text-xl text-white font-bold mb-2">Artists</h2>
                <ul>
                  {searchResults.artists.items.map((artist, index) => (
                    <li
                      key={`${artist.id}-${index}`}
                      className="mb-2 flex items-center group justify-between"
                      onContextMenu={(e) =>
                        handleContextMenu(e, artist.id, "artist")
                      }
                    >
                      <div className="flex items-center">
                        {artist.images[0] && (
                          <img
                            src={artist.images[0].url}
                            alt={artist.name}
                            className="w-12 h-12 mr-4"
                          />
                        )}
                        <div className="flex items-center">
                          <span
                            className="text-white font-bold cursor-pointer hover:underline"
                            onClick={() => handleArtistClick(artist.id)}
                          >
                            {artist.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <img
                          src={playButton}
                          className="w-9 h-9 mx-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchArtistTopTracks(artist.id);
                          }}
                        />
                        <td className="p-4 text-right">
                          <span
                            onClick={(e) =>
                              handleContextMenu(e, artist.id, "artist")
                            }
                            className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
                          >
                            ...
                          </span>
                        </td>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {searchResults.tracks.items.length > 0 && (
              <div className="tracks-section">
                <h2 className="text-xl text-white font-bold mb-2">Tracks</h2>
                <ul>
                  {searchResults.tracks.items.map((track, index) => (
                    <li
                      key={`${track.id}-${index}`}
                      className="mb-2 flex items-center group justify-between"
                      onContextMenu={(e) =>
                        handleContextMenu(e, track.id, "track")
                      }
                    >
                      <div className="flex items-center">
                        {track.album?.images[0] && (
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="w-12 h-12 mr-4"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-white font-bold">
                            {track.name}
                          </span>
                          <div className="flex items-center">
                            <p className="text-gray-700">
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
                        </div>
                        {track?.explicit && (
                          <img
                            src={explicitIcon}
                            alt="Explicit"
                            className="w-4 h-4 ml-2"
                            title="Explicit"
                          />
                        )}
                      </div>
                      <div className="flex items-center">
                        <img
                          src={playButton}
                          className="w-9 h-9 mx-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                          onClick={() => onTrackPlay([track.uri])}
                        />
                        <td className="p-4 text-right">
                          <span
                            onClick={(e) =>
                              handleContextMenu(e, track.id, "track")
                            }
                            className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
                          >
                            ...
                          </span>
                        </td>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {searchResults.albums.items.length > 0 && (
              <div className="albums-section mb-4">
                <h2 className="text-xl text-white font-bold mb-2">Albums</h2>
                <ul>
                  {searchResults.albums.items.map((album, index) => (
                    <li
                      key={`${album.id}-${index}`}
                      className="mb-2 flex items-center group justify-between"
                      onContextMenu={(e) =>
                        handleContextMenu(e, album.id, "album")
                      }
                    >
                      <div className="flex items-center">
                        {album.images[0] && (
                          <img
                            src={album.images[0].url}
                            alt={album.name}
                            className="w-12 h-12 mr-4"
                          />
                        )}
                        <div className="flex items-center">
                          <span
                            className="text-white font-bold cursor-pointer hover:underline"
                            onClick={() => handleAlbumClick(album.id)}
                          >
                            {album.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <img
                          src={playButton}
                          className="w-9 h-9 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                          onClick={() => onAlbumPlay(album.id)}
                        />
                        <td className="p-4 text-right">
                          <span
                            onClick={(e) =>
                              handleContextMenu(e, album.id, "album")
                            }
                            className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
                          >
                            ...
                          </span>
                        </td>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {searchResults.playlists.items.length > 0 && (
              <div className="albums-section mb-4">
                <h2 className="text-xl text-white font-bold mb-2">Playlists</h2>
                <ul>
                  {searchResults.playlists.items.map((playlist, index) => (
                    <li
                      key={`${playlist.id}-${index}`}
                      className="mb-2 flex items-center group justify-between"
                      onContextMenu={(e) =>
                        handleContextMenu(e, playlist.id, "playlist")
                      }
                    >
                      <div className="flex items-center">
                        {playlist.images[0] && (
                          <img
                            src={playlist.images[0].url || defaultPlaylistImage}
                            alt={playlist.name}
                            className="w-12 h-12 mr-4"
                          />
                        )}
                        <div className="flex items-center">
                          <span
                            className="text-white font-bold cursor-pointer hover:underline"
                            onClick={() => handlePlaylistClick(playlist.id)}
                          >
                            {playlist.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <img
                          src={playButton}
                          className="w-9 h-9 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:cursor-pointer hover:brightness-125"
                          onClick={() => onPlaylistPlay(playlist.id)}
                        />
                        <td className="p-4 text-right">
                          <span
                            onClick={(e) =>
                              handleContextMenu(e, playlist.id, "playlist")
                            }
                            className="opacity-0 group-hover:opacity-100 hover:cursor-pointer text-white font-bold text-base tracking-wide"
                          >
                            ...
                          </span>
                        </td>
                      </div>
                    </li>
                  ))}
                </ul>
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
          isOwner={false}
          userPlaylists={playlists.filter(
            (playlist) => playlist.owner.id === userId
          )}
        />
      )}
    </div>
  );
}
