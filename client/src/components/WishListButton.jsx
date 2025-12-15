import React, { useState, useContext } from 'react';
import { API } from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function WishlistButton({ bookId, initial=false }){
  const [added,setAdded]=useState(initial);
  const { user } = useContext(AuthContext);
  async function toggle(){
    if(!user) return alert('Login first');
    if(!added){
      setAdded(true);
      try{ await API.post('/wishlist', { bookId }); } catch(e){ setAdded(false); }
    } else {
      setAdded(false);
      try{ await API.delete(`/wishlist/${bookId}`); } catch(e){ setAdded(true); }
    }
  }
  return <button onClick={toggle}>{added? '♥':'♡'}</button>;
}
