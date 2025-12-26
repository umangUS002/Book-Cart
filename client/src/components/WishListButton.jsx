import { useAppContext } from "../context/AppContext";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";

export default function WishlistButton({ bookId }) {
  const { axios, wishlist, setWishlist } = useAppContext();
  const { isSignedIn, getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const added = wishlist?.includes(bookId);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) return alert("Login first");
    if (loading) return;

    try {
      setLoading(true);

      // 🔑 GET CLERK JWT
      const token = await getToken();

      if (!token) throw new Error("No Clerk token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (!added) {
        await axios.post("/api/wishlist", { bookId }, config);
        setWishlist((prev) => [...prev, bookId]); // optimistic
      } else {
        await axios.delete(`/api/wishlist/${bookId}`, config);
        setWishlist((prev) => prev.filter((id) => id !== bookId));
      }
    } catch (err) {
      console.error("wishlist toggle failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`
        w-8 h-8 flex items-center justify-center rounded-full border
        transition-all duration-300
        ${
          added
            ? "bg-primary text-white border-primary scale-110 shadow-md"
            : "bg-white text-primary border-primary hover:bg-primary/10"
        }
        ${loading && "opacity-50"}
      `}
    >
      <span className="text-xl">{added ? "♥" : "♡"}</span>
    </button>
  );
}
