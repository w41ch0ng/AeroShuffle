import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Track } from "../interfaces";

interface PlaybackContextType {
  currentTrack: Track | null;
  setCurrentTrack: Dispatch<SetStateAction<Track | null>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  tracks: Track[];
  setTracks: Dispatch<SetStateAction<Track[]>>;
  positionMs: number;
  setPositionMs: Dispatch<SetStateAction<number>>;
  trackDuration: number;
  setTrackDuration: Dispatch<SetStateAction<number>>;
  queue: Track[];
  setQueue: Dispatch<SetStateAction<Track[]>>;
  volume: number;
  setVolume: Dispatch<SetStateAction<number>>;
  isShuffle: boolean;
  setIsShuffle: Dispatch<SetStateAction<boolean>>;
  shuffledTracks: Track[];
  setShuffledTracks: Dispatch<SetStateAction<Track[]>>;
  repeatMode: "off" | "context" | "track";
  setRepeatMode: Dispatch<SetStateAction<"off" | "context" | "track">>;
}

// Create the context which contains useStates for playback

const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);

export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [positionMs, setPositionMs] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [volume, setVolume] = useState<number>(50);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [repeatMode, setRepeatMode] = useState<"off" | "context" | "track">(
    "off"
  );

  return (
    <PlaybackContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
        tracks,
        setTracks,
        positionMs,
        setPositionMs,
        trackDuration,
        setTrackDuration,
        queue,
        setQueue,
        volume,
        setVolume,
        isShuffle,
        setIsShuffle,
        shuffledTracks,
        setShuffledTracks,
        repeatMode,
        setRepeatMode,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
};
