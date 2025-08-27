import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mime from 'mime';

const MOVIES_BASE_DIR = process.env.MOVIE_DIR || '/path/to/your/movies';

const statAsync = promisify(fs.stat);

// 支持的视频格式
const SUPPORTED_VIDEO_EXTENSIONS = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv',
    '.flv', '.webm', '.m4v', '.ts', '.mpeg', '.mpg'
];

// 安全的路径验证
function isValidPathSegment(segment: string): boolean {
    console.log(segment);
    if (!segment) return false;

    // 防止目录遍历攻击
    if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
        return false;
    }

    // 只允许字母、数字、下划线、连字符
    return /^[a-zA-Z0-9_-]+$/.test(segment);
}

// 安全的文件名验证
function isValidFilename(filename: string): boolean {
    console.log(filename)
    if (!filename) return false;

    // 防止目录遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return false;
    }

    // 检查文件扩展名
    const ext = path.extname(filename).toLowerCase();
    return SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
}

// 解析范围请求
function parseRange(range: string | null, fileSize: number): { start: number; end: number } | null {
    if (!range) return null;

    const matches = range.match(/bytes=(\d+)-(\d+)?/);
    if (!matches) return null;

    const start = parseInt(matches[1], 10);
    const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;

    if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
        return null;
    }

    return { start, end };
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ category: string; filename: string }> }
) {
    const { category, filename } = await context.params;

    // console.log(category, filename)
    // 验证 category 和 filename
    if (!isValidPathSegment(category) || !isValidFilename(filename)) {
        return NextResponse.json(
            { error: 'Invalid path or filename' },
            { status: 400 }
        );
    }

    try {
        // 构建完整的文件路径
        const filePath = path.join(MOVIES_BASE_DIR, category, decodeURIComponent(filename));

        // 检查文件是否存在且可访问
        const stats = await statAsync(filePath);
        if (!stats.isFile()) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        const fileSize = stats.size;
        const range = request.headers.get('range');

        // 获取 MIME 类型
        const mimeType = mime.getType(filename) || 'video/mp4';
        // 处理范围请求（视频流）
        const rangeInfo = parseRange(range, fileSize);

        if (rangeInfo) {
            const { start, end } = rangeInfo;
            const chunkSize = end - start + 1;

            const headers = new Headers({
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize.toString(),
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            });

            let isCancelled = false;
            const stream = fs.createReadStream(filePath, { start, end });
            const readableStream = new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk) => {
                        if (!isCancelled) {
                            try {
                                controller.enqueue(chunk);
                            } catch (error) {
                                // 控制器可能已关闭，忽略错误
                                stream.destroy();
                                isCancelled = true;
                            }
                        }
                    });

                    stream.on('end', () => {
                        if (!isCancelled) {
                            try {
                                controller.close();
                            } catch (error) {
                                // 忽略关闭错误
                            }
                        }
                    });

                    stream.on('error', (error) => {
                        if (!isCancelled) {
                            try {
                                controller.error(error);
                            } catch (error) {
                                // 忽略错误
                            }
                            isCancelled = true;
                        }
                    });
                },

                cancel() {
                    // 客户端取消请求时调用
                    isCancelled = true;
                    stream.destroy();
                }

            });

            return new Response(readableStream, {
                status: 206,
                headers,
            });
        } else {
            // 完整文件请求
            const headers = new Headers({
                'Content-Length': fileSize.toString(),
                'Content-Type': mimeType,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000, immutable',
            });

            const stream = fs.createReadStream(filePath);
            const readableStream = new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk) => controller.enqueue(chunk));
                    stream.on('end', () => controller.close());
                    stream.on('error', (error) => controller.error(error));
                }
            });

            return new Response(readableStream, {
                status: 200,
                headers,
            });
        }

    } catch (error) {
        console.error('Video streaming error:', error);

        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// 可选：添加 HEAD 请求支持，用于获取文件信息而不下载内容
export async function HEAD(
    request: NextRequest,
    context: { params: Promise<{ category: string; filename: string }> }
) {
    const { category, filename } = await context.params;

    if (!isValidPathSegment(category) || !isValidFilename(filename)) {
        return new NextResponse('invalid file', { status: 400 });
    }

    try {
        const filePath = path.join(MOVIES_BASE_DIR, category, filename);
        const stats = await statAsync(filePath);

        if (!stats.isFile()) {
            return new NextResponse(null, { status: 404 });
        }

        const mimeType = mime.getType(filename) || 'video/mp4';
        const headers = new Headers({
            'Content-Length': stats.size.toString(),
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes',
        });

        return new NextResponse(null, { headers });

    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
            return new NextResponse(null, { status: 404 });
        }
        return new NextResponse(null, { status: 500 });
    }
}

// 配置：不允许其他 HTTP 方法
export async function POST() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}