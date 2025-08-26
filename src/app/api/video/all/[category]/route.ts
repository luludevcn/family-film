import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface RouteParams {
    params: {
        category: string;
    };
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    const { category } = await params;
    const MOVIES_BASE_DIR = process.env.MOVIE_DIR || '/path/to/your/movies';
    try {
        const catogaryFiles = fs.readdirSync(path.join(MOVIES_BASE_DIR, category))
        // const videos = catogaryFiles.filter((file) =>
        //     /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(file)
        // );
        const videos = catogaryFiles.filter((file) =>
            /\.(mp4)$/i.test(file)
        );
        return NextResponse.json(videos);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
