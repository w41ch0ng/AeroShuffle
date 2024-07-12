import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Playlist, Album, Track, Artist, ArtistDetails } from "../interfaces";

interface AlbumPlaylistContextType {
  playlist: Playlist | null;
  setPlaylist: Dispatch<SetStateAction<Playlist | null>>;
  playlists: Playlist[];
  setPlaylists: Dispatch<SetStateAction<Playlist[]>>;
  album: Album | null;
  setAlbum: Dispatch<SetStateAction<Album | null>>;
  albums: Album[];
  setAlbums: Dispatch<SetStateAction<Album[]>>;
  likedSongs: Track[];
  setLikedSongs: Dispatch<SetStateAction<Track[]>>;
  topTracks: Track[];
  setTopTracks: Dispatch<SetStateAction<Track[]>>;
  artistTopTracks: Track[];
  setArtistTopTracks: Dispatch<SetStateAction<Track[]>>;
  recommendedTracks: Track[];
  setRecommendedTracks: Dispatch<SetStateAction<Track[]>>;
  artist: ArtistDetails | null;
  setArtist: Dispatch<SetStateAction<ArtistDetails | null>>;
  topArtists: Artist[];
  setTopArtists: Dispatch<SetStateAction<Artist[]>>;
  isFollowing: boolean;
  setIsFollowing: Dispatch<SetStateAction<boolean>>;
  inLibrary: boolean;
  setInLibrary: Dispatch<SetStateAction<boolean>>;
}

/* Create the context which contains useStates for albums & playlists
  and album & playlist details */

const AlbumPlaylistContext = createContext<
  AlbumPlaylistContextType | undefined
>(undefined);

export const AlbumPlaylistProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [artistTopTracks, setArtistTopTracks] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [inLibrary, setInLibrary] = useState<boolean>(false);

  return (
    <AlbumPlaylistContext.Provider
      value={{
        playlist,
        setPlaylist,
        playlists,
        setPlaylists,
        album,
        setAlbum,
        albums,
        setAlbums,
        likedSongs,
        setLikedSongs,
        topTracks,
        setTopTracks,
        artistTopTracks,
        setArtistTopTracks,
        recommendedTracks,
        setRecommendedTracks,
        artist,
        setArtist,
        topArtists,
        setTopArtists,
        isFollowing,
        setIsFollowing,
        inLibrary,
        setInLibrary,
      }}
    >
      {children}
    </AlbumPlaylistContext.Provider>
  );
};

export const useAlbumPlaylist = () => {
  const context = useContext(AlbumPlaylistContext);
  if (!context) {
    throw new Error(
      "useAlbumPlaylist must be used within a AlbumPlaylistProvider"
    );
  }
  return context;
};
