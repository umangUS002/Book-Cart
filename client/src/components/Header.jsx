import React, { useRef, useState, useMemo } from 'react';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { setInput, input, books } = useAppContext();
  const inputRef = useRef();
  const navigate = useNavigate();

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get all unique authors and genres
  const allAuthors = useMemo(
    () => [...new Set(books.map((b) => b.author?.toLowerCase()))],
    [books]
  );
  const allGenres = useMemo(
    () => [...new Set(books.map((b) => b.genre?.toLowerCase()))],
    [books]
  );

  const query = input.trim().toLowerCase();

  let inputType = 'title';
  if (allAuthors.some((author) => author?.includes(query))) inputType = 'author';
  else if (allGenres.some((genre) => genre?.includes(query))) inputType = 'genre';

  const filteredSuggestions = books
    .filter((book) => {
      if (inputType === 'author') return book.author?.toLowerCase().includes(query);
      if (inputType === 'genre') return book.genre?.toLowerCase().includes(query);
      return book.title?.toLowerCase().includes(query);
    })
    .slice(0, 5);

  const onSubmitHandler = (e) => {
    e.preventDefault();
    setInput(inputRef.current.value);
    setShowSuggestions(false);
  };

  const onClear = () => {
    setInput('');
    inputRef.current.value = '';
    setShowSuggestions(false);
  };

  const handleSelect = (text, id) => {
    setInput(text);
    inputRef.current.value = text;
    setShowSuggestions(false);
  };

  return (
    <div className='mx-8 sm:mx-16 xl:mx-24 relative'>
      <div className='text-center mt-10 mb-8'>
        <div className='inline-flex items-center justify-center gap-4 px-6 py-1.5 mb-4 border-primary/40 bg-primary/10 rounded-full text-sm text-primary'>
          <p>New : AI Feature Integrated</p>
          <img src={assets.star_icon1} className='-ml-3 w-5' alt='' />
        </div>

        <h1 className='text-3xl sm:text-6xl font-semibold sm:leading-16 text-gray-700'>
          Your own <span className='text-primary'>Bookstore</span> <br /> Read. Escape. Repeat..
        </h1>
        <p className='my-6 sm:my-8 max-w-2xl m-auto max-sm:text-xs text-gray-500'>
          This is your place to explore new worlds, dive into gripping stories, and discover books that speak to you.
        </p>

        <form
          onSubmit={onSubmitHandler}
          className='relative max-w-lg mx-auto border border-gray-300 bg-white rounded overflow-hidden'
        >
          <input
            ref={inputRef}
            type='text'
            placeholder='Search by title or author...'
            className='w-full px-4 py-3 outline-none'
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => input && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            value={input}
          />
          <button
            className='absolute right-1.5 top-1.5 bg-primary text-white px-4 py-1.5 rounded hover:scale-105 transition-all cursor-pointer'
            type='submit'
          >
            Search
          </button>

          {showSuggestions && (
            <ul className='absolute z-[9999] top-full left-0 right-0 bg-white border border-t-0 border-gray-300 rounded-b shadow max-h-60 overflow-y-auto text-sm'>
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((book) => {
                  let label =
                    inputType === 'author'
                      ? book.author
                      : inputType === 'genre'
                      ? book.genre
                      : book.title;

                  return (
                    <li
                      key={book._id}
                      onMouseDown={() => handleSelect(label, book._id)}
                      className='px-4 py-2 cursor-pointer hover:bg-primary hover:text-white transition-all'
                    >
                      {label}
                    </li>
                  );
                })
              ) : (
                <li className='px-4 py-2 text-gray-500'>No items found</li>
              )}
            </ul>
          )}
        </form>

        <div className='text-center'>
          {input && (
            <button
              onClick={onClear}
              className='border font-light text-xs mt-10 py-1 px-3 rounded-sm shadow-custom-sm cursor-pointer'
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      <img src={assets.gradient} className='absolute -top-50 -z-1 opacity-50' />
    </div>
  );
}

export default Header;
