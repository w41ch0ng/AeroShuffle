export interface Category {
  id: string;
  name: string;
  icons: { url: string }[];
  href: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: {
    items: { track: Track }[];
  };
  owner: {
    id: string;
  };
  public: boolean;
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  explicit: boolean;
  type: "track";
  linked_from: Track;
  is_playable: boolean;
  uid: string;
  media_type: "audio" | "video";
  track_type: "audio" | "video";
}

export interface PlaylistTrack {
  track: {
    id: string;
  };
}

export interface Artist {
  name: string;
  id: string;
  images: { url: string }[];
  uri: string;
  url: string;
}

export interface Album {
  images: { url: string }[];
  name: string;
  id: string;
  uri: string;
  description: string;
  tracks: {
    items: Track[];
  };
  release_date: string;
}

export interface LikedSongs {
  items: { track: Track }[];
}

export interface SearchResult {
  artists: { items: Artist[] };
  albums: { items: Album[] };
  tracks: { items: Track[] };
  playlists: { items: Playlist[] };
}

export interface ArtistDetails {
  id: string;
  name: string;
  images: { url: string }[];
  followers: { total: number };
  genres: string[];
}
