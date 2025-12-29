import React, { useState } from "react";

function NewsLetter() {
  const [email, setEmail] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault(); // ✅ prevent page reload

    if (!email) return;

    try {
      const res = await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log(data);

      setEmail(""); // clear input
    } catch (err) {
      console.error("Subscription failed", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 my-32">
      <h1 className="md:text-4xl text-2xl font-semibold">
        Never Miss an Update!
      </h1>
      <p className="md:text-lg text-gray-500/70 pb-8">
        Subscribe to get the latest addition and book news.
      </p>

      {/* ✅ handle submit on form */}
      <form
        onSubmit={handleSubscribe}
        className="flex items-center justify-between max-w-2xl md:w-full px-4 md:h-13 h-12"
      >
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)} // ✅ important
          type="email" // ✅ better
          placeholder="Enter your email id"
          required
          className="border border-gray-300 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500"
        />

        <button
          type="submit"
          className="md:px-12 px-8 h-full text-white bg-primary/80 hover:bg-primary transition-all cursor-pointer rounded-md rounded-l-none"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}

export default NewsLetter;
