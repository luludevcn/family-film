'use client'
import { useParams } from 'next/navigation';

export default function videoPage() {
    const { filename, category } = useParams<{ filename: string, category: string }>();

    if (!filename) {
        return <div>Loading...</div>;
    }

    const videoSrc = `/api/video/${category}/${encodeURIComponent(filename)}`;

    return (
        <div className='pt-10'>
            <video controls autoPlay className='w-full'>
                <source src={videoSrc} type="video/mp4" />
                您的浏览器不支持 HTML5 视频标签。
            </video>
            <h2 className='text-xl font-bold m-5 p-5' >正在播放: {decodeURIComponent(filename)} </h2>
        </div>
    );
}