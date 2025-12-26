// client/src/contexts/AppContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // in-memory token (preferred)
  const [token, setToken] = useState(null);
  const [userToken, setUserToken] = useState(true);

  // keep localStorage compatibility for your existing flow
  const [persistToken, setPersistToken] = useState(() => localStorage.getItem("token"));

  const [input, setInput] = useState("");
  const [books, setBooks] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Create axios instance that sends cookies (refresh token)
  const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
  axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
axios.defaults.withCredentials = true;

  // const refreshApi = axios.create({
  //   baseURL: API_BASE,
  //   withCredentials: true,
  // });

  // Request interceptor:
  // - attach Authorization if we have in-memory token
  // - otherwise, try to refresh using refresh cookie and set token
  // api.interceptors.request.use(
  //   async (config) => {
  //     // Attach token if present
  //     if (token) {
  //       config.headers = config.headers || {};
  //       config.headers.Authorization = `Bearer ${token}`;
  //       return config;
  //     }

  //     // Try refresh ONLY ONCE using refreshApi (no interceptor)
  //     try {
  //       const resp = await refreshApi.post("/api/auth/refresh");
  //       if (resp?.data?.accessToken) {
  //         setToken(resp.data.accessToken);
  //         localStorage.setItem("token", resp.data.accessToken);
  //         config.headers = config.headers || {};
  //         config.headers.Authorization = `Bearer ${resp.data.accessToken}`;
  //       }
  //     } catch (err) {
  //       // refresh failed → continue without token
  //     }

  //     return config;
  //   },
  //   (error) => Promise.reject(error)
  // );


  // --- AUTH helpers ---
  const userLogin = async (email, password) => {
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      const newToken = data?.accessToken;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("token", newToken);
        setPersistToken(newToken);
      }
      setUserFromPayload(data?.user);
      toast.success("Logged in");
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      throw err;
    }
  };

  const userSignup = async (name, email, password) => {
    try {
      const { data } = await axios.post("/api/auth/signup", { name, email, password });
      const newToken = data?.accessToken;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("token", newToken);
        setPersistToken(newToken);
      }
      setUserFromPayload(data?.user);
      toast.success("Account created");
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      throw err;
    }
  };

  const userLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (e) {
      // ignore network errors on logout
    } finally {
      setToken(null);
      setPersistToken(null);
      localStorage.removeItem("token");
      // remove Authorization default header if you had set it elsewhere
      toast.success("Logged out");
      navigate("/login");
    }
  };

  // optional helper to set user in your app (if needed)
  const setUserFromPayload = (user) => {
    // if you want to store user info in context, add a state for it and set here
    // setUser(user)
  };

  // --- BOOKS / SIMILAR ---
  const fetchBooks = async () => {
    try {
      const { data } = await axios.get("/api/book/all");
      if (data?.success) setBooks(data.books);
      else toast.error(data?.message || "Failed to load books");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // try recommendation service endpoint first, otherwise fall back to your older path
  const fetchSimilarBooks = async (bookId) => {
    try {
      // try /api/recommendations/book/:bookId (recommender proxy)
      let resp;
      try {
        resp = await axios.get(`/api/recommendations/book/${bookId}`);
        // if the recommender returns raw books (array) use it
        if (Array.isArray(resp.data)) {
          setSimilarBooks(resp.data);
          return;
        }
      } catch (e) {
        // fallback to older endpoint below
      }

      // fallback to existing endpoint you had in the app
      const fallback = await axios.get(`/api/book/similar-books/${bookId}`);
      const payload = fallback.data;
      if (payload?.success) setSimilarBooks(payload.similarBooks || []);
      else toast.error(payload?.message || "No similar books found");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // --- WISHLIST ---
  const getWishlist = async () => {
  const { data } = await axios.get("/api/wishlist");
  const ids = data.map(item => item.bookId._id || item.bookId);
  setWishlist(ids);
};



  const addToWishlist = async (bookId) => {
    try {
      const { data } = await axios.post("/api/wishlist", { bookId });
      toast.success("Added to wishlist");
      // refresh local wishlist
      await getWishlist();
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      throw err;
    }
  };

  const removeFromWishlist = async (bookId) => {
    try {
      await axios.delete(`/api/wishlist/${bookId}`);
      toast.success("Removed from wishlist");
      await getWishlist();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      throw err;
    }
  };

  // --- COMMENTS (creates comment via server which will call sentiment microservice) ---
  const postComment = async (bookId, text, rating = null) => {
    try {
      const { data } = await axios.post(`/api/books/${bookId}/comments`, { text, rating });
      toast.success("Comment posted");
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      throw err;
    }
  };

  // --- RECOMMENDATIONS ---
  const getRecommendations = async () => {
    try {
      const { data } = await axios.get(`/api/recommendations`);
      setRecommendations(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      return [];
    }
  };

  // --- INIT / EFFECTS ---
  useEffect(() => {
    fetchBooks();
    getWishlist();
  }, [])

  const value = {

    axios, // raw axios instance if you need it directly
    navigate,
    token,
    setToken,
    input,
    setInput,
    books,
    setBooks,
    fetchBooks,
    similarBooks,
    setSimilarBooks,
    fetchSimilarBooks,

    // auth
    // login,
    // signup,
    // logout,

    // wishlist
    wishlist,
    getWishlist,
    addToWishlist,
    removeFromWishlist,

    // comments
    postComment,

    // recommendations
    recommendations,
    getRecommendations,

    userToken,
    setUserToken
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
