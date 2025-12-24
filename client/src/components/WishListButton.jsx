import React, { useState, useContext } from 'react';
import { useAppContext } from '../context/AppContext';

export default function WishlistButton({ bookId, initial=false }){
  const [added, setAdded]=useState(initial);
  const { userToken, axios } = useAppContext();

  async function toggle(e){
  e.preventDefault();
  e.stopPropagation();

  if(!userToken) return alert('Login first');

  if(!added){
    setAdded(true);
    try {
      await axios.post('/api/wishlist', { bookId });
    } catch(e){
      setAdded(false);
    }
  } else {
    setAdded(false);
    try {
      await axios.delete(`/api/wishlist/${bookId}`);
    } catch(e){
      setAdded(true);
    }
  }
}

  return (
  <button onClick={toggle}>
    {added ? '♥' : '♡'}
  </button>
);

}
