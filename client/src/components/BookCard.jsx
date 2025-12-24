import React from 'react'
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import WishlistButton from './WishListButton';

function BookCard({ blog }) {

  if (!blog) return null;

  const { title, description, genre, image, _id, author, rating } = blog;
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/book/${_id}`)} className='w-full max-sm:mb-12 rounded-lg overflow-hidden shadow hover:scale-102 hover:shadow-primary/25 duration-300 cursor-pointer'>
      <img src={image} alt='' className='aspect-[2/3]' />
      <div className='flex justify-between'>
        <span className='ml-5 max-sm:ml-1 mt-4 px-3 py-1 inline-block bg-primary/20 rounded-full text-primary text-xs'>{genre}</span>
        <div className='flex mt-4 px-3'>
          <WishlistButton />
        </div>
      </div>
      <div className='p-5 max-sm:p-2'>
        <h5 className='mb-1 max-sm:text-xs font-medium text-gray-900'>{title}</h5>
        <p className='mb-4 text-sm max-sm:text-xs text-gray-900'>{author}</p>
        <p className='mb-3 text-xs text-gray-600' dangerouslySetInnerHTML={{ "__html": description.slice(0, 50) }}></p>
        <div className='flex gap-2'>
          <StarRating rating={rating} />
        </div>
      </div>
    </div>
  )
}

export default BookCard
