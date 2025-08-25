'use client'
import { Image, Link } from '@heroui/react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function videoPage() {
    const { filename, category } = useParams<{ filename: string, category: string }>();
    const [videos, setVideos] = useState([]);
    if (!filename) {
        return <div>Loading...</div>;
    }

    const videoSrc = `/api/video/${category}/${encodeURIComponent(filename)}`;

    useEffect(() => {
        fetch(`/api/video/all/${category}`).then(res => res.json()).then((data) => {
            setVideos(data)
        });
    }, [])

    return (
        <>
            <div className='p-10'>
                <Link href='/'><Image src={'/logo.png'}></Image></Link>
            </div>
            <div className='pt-10'>
                <video controls className='w-full'>
                    <source src={videoSrc} type="video/mp4" />
                    您的浏览器不支持 HTML5 视频标签。
                </video>
                <h2 className='text-xl font-bold m-5 p-5' >正在播放: {decodeURIComponent(filename)} </h2>
                <div className='flex p-5 flex-wrap'>
                    {videos.map((video, index) => (
                        <div key={index} className='inline-block border-amber-300 m-5 px-5 w-fit border rounded-2xl'>
                            <Link className='leading-10' href={`/video/${category}/${encodeURIComponent(video)}`}>{video}</Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}