import React from 'react'
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

function Navbar() {

    const {navigate, token} = useAppContext();

  return (
    <div className='flex  justify-between items-center px-2 sm:px-20 xl:px-32 cursor pointer shadow max-sm:py-2'>
        <div className='flex -ml-4 max-sm:px-4'>
            <img onClick={()=> navigate('/')} src={assets.logo} className='h-16 max-sm:h-10 max-sm:w-12 w-18 cursor-pointer mt-3 max-sm:mt-2 mr-2' />
            <h1 onClick={()=> navigate('/')} className='mt-6 max-sm:mt-3 -ml-3 font-bold text-3xl max-sm:text-xl text-primary cursor-pointer'>Book Cart</h1>
        </div>
      <button onClick={()=>navigate('/admin')} className='flex items-center gap-2 max-sm:gap-1 rounded-full text-sm max-sm:text-xs cursor-pointer bg-primary text-white px-5 max-sm:px-3 max-sm:mt-1 sm:px-10 py-2.5'>
        {token ? 'Dashboard' : 'Admin'}
        <img src={assets.arrow}  alt='arrow' />
      </button>
    </div>
  )
}

export default Navbar
