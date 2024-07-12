import {
  createContext,
  useContext,
  useState,
  ReactNode,
  MouseEvent,
  useEffect,
} from "react";
import apiClient from "../spotify";
import { useAlbumPlaylist } from "../contexts/AlbumPlaylistContext";
import { Playlist } from "../interfaces";

interface ContextMenuContextProps {
  contextMenuItemId: string | null;
  itemType: "track" | "artist" | "playlist" | "album" | null;
  contextMenuPosition: { x: number; y: number };
  setContextMenuItem: (
    id: string | null,
    type: "track" | "artist" | "playlist" | "album" | null
  ) => void;
  setContextMenuPosition: (position: { x: number; y: number }) => void;
  handleContextMenu: (
    e: MouseEvent,
    id: string,
    type: "track" | "artist" | "playlist" | "album"
  ) => void;
  handleAddToLikedSongs: () => void;
  handleAddToPlaylist: (playlistId: string) => void;
  handleRemoveTrack: () => void;
  handleFollowArtist: () => void;
  handleAddPlaylistToLibrary: () => void;
  handleAddAlbumToLibrary: () => void;
  isOwner: boolean;
  userPlaylists: Playlist[];
}

// Create the context which contains useStates for the context menu

const ContextMenuContext = createContext<ContextMenuContextProps | undefined>(
  undefined
);

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const { playlist, setPlaylist, playlists, setLikedSongs } =
    useAlbumPlaylist();
  const [contextMenuItemId, setContextMenuItemId] = useState<string | null>(
    null
  );
  const [itemType, setContextMenuItemType] = useState<
    "track" | "artist" | "playlist" | "album" | null
  >(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (playlist) {
      setUserId(playlist.owner.id);
    }
  }, [playlist]);

  const handleContextMenu = (
    e: MouseEvent,
    id: string,
    type: "track" | "artist" | "playlist" | "album"
  ) => {
    e.preventDefault();
    setContextMenuItem(id, type);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const setContextMenuItem = (
    id: string | null,
    type: "track" | "artist" | "playlist" | "album" | null
  ) => {
    setContextMenuItemId(id);
    setContextMenuItemType(type);
  };

  const handleAddToLikedSongs = async () => {
    if (!contextMenuItemId) return;

    try {
      await apiClient.put(`me/tracks`, {
        ids: [contextMenuItemId],
      });
    } catch (error) {
      console.error("Error adding track to liked songs:", error);
    }
    setContextMenuItem(null, null);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!contextMenuItemId) return;

    try {
      await apiClient.post(`playlists/${playlistId}/tracks`, {
        uris: [`spotify:track:${contextMenuItemId}`],
      });
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
    setContextMenuItem(null, null);
  };

  const handleRemoveTrack = async () => {
    if (!contextMenuItemId) return;

    try {
      if (playlist) {
        // Remove track from playlist
        await apiClient.delete(`playlists/${playlist.id}/tracks`, {
          data: {
            tracks: [
              {
                uri: playlist.tracks.items.find(
                  (item) => item.track.id === contextMenuItemId
                )?.track.uri,
              },
            ],
          },
        });

        const updatedPlaylist = { ...playlist };
        updatedPlaylist.tracks.items = updatedPlaylist.tracks.items.filter(
          (item) => item.track.id !== contextMenuItemId
        );
        setPlaylist(updatedPlaylist);
      } else {
        // Remove track from liked songs
        await apiClient.delete(`me/tracks`, {
          data: { ids: [contextMenuItemId] },
        });
        setLikedSongs((prevTracks) =>
          prevTracks.filter((track) => track.id !== contextMenuItemId)
        );
      }
    } catch (error) {
      console.error("Error removing track:", error);
    }
    setContextMenuItem(null, null);
  };

  const handleFollowArtist = async () => {
    if (!contextMenuItemId) return;
    console.log("artist id" + contextMenuItemId);
    try {
      await apiClient.put(`me/following?type=artist&ids=${contextMenuItemId}`);
    } catch (error) {
      console.error("Error following artist:", error);
    }
    setContextMenuItem(null, null);
  };

  const handleAddPlaylistToLibrary = async () => {
    if (!contextMenuItemId) return;

    try {
      await apiClient.put(`playlists/${contextMenuItemId}/followers`);
    } catch (error) {
      console.error("Error adding playlist to library:", error);
    }
    setContextMenuItem(null, null);
  };

  const handleAddAlbumToLibrary = async () => {
    if (!contextMenuItemId) return;

    try {
      await apiClient.put(`me/albums?ids=${contextMenuItemId}`);
    } catch (error) {
      console.error("Error adding album to library:", error);
    }
    setContextMenuItem(null, null);
  };

  return (
    <ContextMenuContext.Provider
      value={{
        contextMenuItemId,
        itemType,
        contextMenuPosition,
        setContextMenuItem,
        setContextMenuPosition,
        handleContextMenu,
        handleAddToLikedSongs,
        handleAddToPlaylist,
        handleRemoveTrack,
        handleFollowArtist,
        handleAddPlaylistToLibrary,
        handleAddAlbumToLibrary,
        isOwner: playlist?.owner.id === userId,
        userPlaylists: playlists,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => useContext(ContextMenuContext);
