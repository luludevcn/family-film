'use client'

import Link from 'next/link';
import { Accordion, AccordionItem, Alert, Divider } from '@heroui/react';
import { useEffect, useState } from 'react';

export default function Home() {

  const title = "The application is for learning and testing only.";
  const description = "Copyright is reserved by the original";

  const [videoFiles, setVideoFiles] = useState<VideoFiles>({ categories: [{ name: '', label: '', videos: [] }] })

  useEffect(() => {
    fetch('/api/video/all').then(res => res.json()).then(data => setVideoFiles(data));
  }, [])


  return (
    <div className="w-full">
      <Alert description={description} title={title} />
      <h1 className='text-2xl font-bold text-center py-10'>家庭影库</h1>
      <Accordion variant="splitted">
        {videoFiles.categories?.map((category) => (
          <AccordionItem key={category.name} aria-label={category.label} title={`${category.label}`} subtitle={`[1-${category.videos.length}]`}>
            <Divider></Divider>
            {category.videos.map((video, index) => (
              <div key={index} className='inline-block border-amber-300 m-5 px-5 w-fit border rounded-2xl'>
                <Link className='leading-10' href={`/video/${category.name}/${encodeURIComponent(video)}`}>{video}</Link>
              </div>
            ))}
          </AccordionItem>
        ))}
      </Accordion>
    </div >
  );
}
