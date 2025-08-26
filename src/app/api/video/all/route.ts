import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
    request: NextRequest
) {
    const MOVIES_BASE_DIR = process.env.MOVIE_DIR || '/path/to/your/movies';
    const videoFiles: VideoFiles = { categories: [] };
    try {
        const catogaries = fs.readdirSync(MOVIES_BASE_DIR);
        catogaries.map(category => {
            const catogaryFiles = fs.readdirSync(path.join(MOVIES_BASE_DIR, category))
            // const videos = catogaryFiles.filter((file) =>
            //     /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(file)
            // );
            const videos = catogaryFiles.filter((file) =>
                /\.(mp4)$/i.test(file)
            );
            const metadataFile = catogaryFiles.filter((file) =>
                /\.(json)$/i.test(file)
            );
            if (metadataFile[0]) {
                const metadata = fs.readFileSync(path.join(MOVIES_BASE_DIR, category, metadataFile[0]), { encoding: 'utf8' })
                videoFiles.categories.push({ name: category, label: JSON.parse(metadata).name, videos: videos })
            } else {
                videoFiles.categories.push({ name: category, label: category, videos: videos })
            }
        })
        return NextResponse.json(videoFiles);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
