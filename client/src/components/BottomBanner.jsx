import React from 'react'
import { assets, features } from '../assets/assets'

const BottomBanner = () => {
  return (
    <div className='mt-16 flex lg:flex-row flex-col-reverse gap-2 rounded-xl'>
        <div className='lg:w-1/2 w-full'>
            <img src={assets.bottom_banner_image} alt="banner" className='w-full h-full rounded-lg'/>       
            {/* <img src={assets.bottom_banner_image_sm} alt="banner" className='w-full md:hidden'/>        */}
        </div>

        <div className='flex flex-col items-center md:justify-center bg-secondary w-full py-8 lg:w-1/2 rounded-xl'>
            <div>
                <h1 className='text-2xl md:text-3xl font-semibold text-primary mb-6'>Why We Are the Best?</h1>
                {features.map((feature,index)=>(
                    <div key={index} className='flex items-center gap-4 mt-2'>
                        <img src={feature.icon} alt={feature.title} className='md:w-11 w-9'/>
                        <div>
                            <h3 className='text-lg md:text-xl font-semibold'>{feature.title}</h3>
                            <p className='text-gray-500/70 text-xs md:text-sm'>{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  )
}

export default BottomBanner
