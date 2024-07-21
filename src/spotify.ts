import axios from "axios";

// Spotify API authentication endpoints and constants
const authEndpoint = "https://accounts.spotify.com/authorize?";
const tokenEndpoint = "https://accounts.spotify.com/api/token";
const clientId = import.meta.env.VITE_CLIENT_ID; // Client ID obtained from environment variables
const redirectUri = import.meta.env.VITE_REDIRECT; // Redirect URI for the Spotify authentication flow
const scopes = [
  "streaming",
  "user-read-private",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "ugc-image-upload",
  "user-top-read",
  "user-follow-modify",
  "user-follow-read",
]; // Array of Spotify API scopes required

// Helper functions for PKCE authorisation flow below

// Helper function to generate a random string of a given length
const generateRandomString = (length: number) => {
  // Possible characters for the random string
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // Generate random values
  const values = crypto.getRandomValues(new Uint8Array(length));
  // Create random string
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Async function to generate SHA-256 hash of a given string
const sha256 = async (plain: string) => {
  // Encode the plain text with the new TextEncoder instance
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data); // Generate the SHA-256 hash
};

// Function to base64 encode an ArrayBuffer
const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input))) // Convert ArrayBuffer to base64 string
    .replace(/=/g, "") // Remove padding '=' characters
    .replace(/\+/g, "-") // Replace '+' with '-'
    .replace(/\//g, "_"); // Replace '/' with '_'
};

// Async function to generate a code challenge for PKCE
const generateCodeChallenge = async (verifier: string) => {
  const hashed = await sha256(verifier); // Generate SHA-256 hash of the verifier
  return base64encode(hashed); // Base64 encode the hashed verifier
};

// Function to get the Spotify login endpoint URL
export const getLoginEndpoint = async () => {
  const codeVerifier = generateRandomString(64); // Generate a random code verifier
  const codeChallenge = await generateCodeChallenge(codeVerifier); // Generate a code challenge

  window.localStorage.setItem("code_verifier", codeVerifier); // Store the code verifier in local storage

  const params = {
    // Parameters for the authorisation request
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes.join(" "), // Join scopes array into a space-separated string
    code_challenge_method: "S256", // Code challenge method
    code_challenge: codeChallenge, // Code challenge
  };

  return `${authEndpoint}${new URLSearchParams(params).toString()}`; // Construct the authorisation URL
};

// Axios instance for making Spotify API requests
const apiClient = axios.create({
  baseURL: "https://api.spotify.com/v1/", // Base URL linking to the Spotify API
});

// Function to set the client token in Axios headers
export const setClientToken = (token: string) => {
  apiClient.interceptors.request.use(async function (config) {
    // Use an interceptor to set the Authorisation header
    config.headers.Authorization = "Bearer " + token; // Set the Authorisation header
    return config; // Return the updated config
  });
};

// Async function to fetch the user's Spotify product (free, premium, etc.)
export const getUserProduct = async (token: string) => {
  try {
    // Make a GET request to the 'me' endpoint with the authorisation header inc/ token
    const response = await apiClient.get("me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.product; // Return the user's product (Free/Premium)
  } catch (error) {
    console.error("Error fetching user product:", error);
    return null;
  }
};

// Async function to fetch access token using authorisation code
export const fetchAccessToken = async (code: string) => {
  // Retrieve the code verifier from local storage
  const codeVerifier = window.localStorage.getItem("code_verifier");
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier!, // Add code verifier to params
  });

  try {
    // Make a POST request to the token endpoint
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token, expires_in, refresh_token } = response.data; // Destructure the response data
    const expiryTime = new Date().getTime() + expires_in * 1000; // Calculate the expiry time

    // Store the access token, its expiry time, and the refresh token in local storage
    window.localStorage.setItem("token", access_token);
    window.localStorage.setItem("tokenExpiry", expiryTime.toString());
    window.localStorage.setItem("refresh_token", refresh_token);
    setClientToken(access_token); // Set the access token

    return access_token; // Return the access token
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null; // Return null in case of error
  }
};

// Async function to refresh access token using refresh token
export const refreshAccessToken = async () => {
  // Retrieve the refresh token from local storage
  const refreshToken = window.localStorage.getItem("refresh_token");
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken!, // Add the refresh token to params
    client_id: clientId,
  });

  try {
    // Make a POST request to the token endpoint
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Destructure the response data
    const { access_token, expires_in, refresh_token } = response.data;
    const expiryTime = new Date().getTime() + expires_in * 1000; // Calculate the expiry time

    // Store the new access token, its expiry time and the refresh token in local storage
    window.localStorage.setItem("token", access_token);
    window.localStorage.setItem("tokenExpiry", expiryTime.toString());

    if (refresh_token) {
      window.localStorage.setItem("refresh_token", refresh_token);
    } // try no if block if it does not work first

    setClientToken(access_token); // Set the access token

    return access_token; // Return the access token
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null; // Return null in case of error
  }
};

export default apiClient; // Export the Axios instance for API requests
