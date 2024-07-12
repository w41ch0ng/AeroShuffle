import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Track, Category, Playlist, SearchResult } from "../interfaces";

interface UserSearchCategoryContextType {
  userId: string | null;
  setUserId: Dispatch<SetStateAction<string | null>>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: Track[];
  setResults: Dispatch<SetStateAction<Track[]>>;
  searchResults: SearchResult | null;
  setSearchResults: Dispatch<SetStateAction<SearchResult | null>>;
  category: Category | null;
  setCategory: Dispatch<SetStateAction<Category | null>>;
  categories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
  categoryPlaylists: Playlist[];
  setCategoryPlaylists: Dispatch<SetStateAction<Playlist[]>>;
}

/* Create the context which contains useStates for user details, search
functionality and Spotify categories */

const UserSearchCategoryContext = createContext<
  UserSearchCategoryContextType | undefined
>(undefined);

export const UserSearchCategoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Track[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPlaylists, setCategoryPlaylists] = useState<Playlist[]>([]);

  return (
    <UserSearchCategoryContext.Provider
      value={{
        userId,
        setUserId,
        query,
        setQuery,
        results,
        setResults,
        searchResults,
        setSearchResults,
        category,
        setCategory,
        categories,
        setCategories,
        categoryPlaylists,
        setCategoryPlaylists,
      }}
    >
      {children}
    </UserSearchCategoryContext.Provider>
  );
};

export const useUserSearchCategory = () => {
  const context = useContext(UserSearchCategoryContext);
  if (!context) {
    throw new Error(
      "useUserSearchCategory must be used within a UserSearchCategoryProvider"
    );
  }
  return context;
};
