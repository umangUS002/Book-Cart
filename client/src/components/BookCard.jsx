import React from 'react'
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';

function BookCard({blog}) {

    if (!blog) return null;

    const {title, description, genre, image, _id, author, rating} = blog;
    const navigate = useNavigate();

  return (
    <div onClick={()=>navigate(`/book/${_id}`)} className='w-full max-sm:mb-12 rounded-lg overflow-hidden shadow hover:scale-102 hover:shadow-primary/25 duration-300 cursor-pointer'>
      <img src={image} alt='' className='aspect-[2/3]'/>
      <span className='ml-5 mt-4 px-3 py-1 inline-block bg-primary/20 rounded-full text-primary text-xs'>{genre}</span>
      <div className='p-5 max-sm:p-2'>
        <h5 className='mb-1 max-sm:text-sm font-medium text-gray-900'>{title}</h5>
        <p className='mb-4 text-sm text-gray-900'>{author}</p>
        <p className='mb-3 text-xs text-gray-600' dangerouslySetInnerHTML={{"__html":description.slice(0,50)}}></p>
            <div className='flex gap-2'>
                <StarRating rating={rating} />
            </div>
      </div>
    </div>
  )
}

export default BookCard
