import React from 'react'
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

function Navbar() {

    const {navigate, token} = useAppContext();

  return (
    <div className='flex justify-between items-center py- mx-8 sm:mx-20 xl:mx-32 cursor pointer'>
        <div className='flex -ml-4'>
            <img onClick={()=> navigate('/')} src={assets.logo} className='h-16 w-18 cursor-pointer mt-3 mr-2' />
            <h1 onClick={()=> navigate('/')} className='mt-6 -ml-3 font-bold text-3xl text-primary cursor-pointer'>Book Cart</h1>
        </div>
      <button onClick={()=>navigate('/admin')} className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-5 sm:px-10 py-2.5'>
        {token ? 'Dashboard' : 'Admin'}
        <img src={assets.arrow}  alt='arrow' />
      </button>
    </div>
  )
}

export default Navbar
