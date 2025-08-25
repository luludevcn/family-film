# convert_mkv_to_mp4.py
import os
import subprocess
import sys
from pathlib import Path
from tqdm import tqdm

def find_ffmpeg():
    """查找 ffmpeg 可执行文件"""
    try:
        # 检查是否在 PATH 中
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        if result.returncode == 0:
            return 'ffmpeg'
    except FileNotFoundError:
        pass
    
    # 检查常见安装位置
    common_paths = [
        r'C:\ffmpeg\bin\ffmpeg.exe',
        r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
        r'C:\Tools\ffmpeg\bin\ffmpeg.exe',
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            return path
    
    return None

def convert_mkv_to_mp4(mkv_path, mp4_path, ffmpeg_path):
    """转换单个 MKV 文件到 MP4"""
    cmd = [
        ffmpeg_path,
        '-i', str(mkv_path),
        '-c:v', 'copy',          # 拷贝视频流
        '-c:a', 'aac',           # 转换音频到 AAC
        '-movflags', '+faststart', # 优化网络播放
        '-y',                    # 覆盖输出文件
        str(mp4_path)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"超时: {mkv_path.name}")
        return False
    except Exception as e:
        print(f"错误: {mkv_path.name} - {e}")
        return False

def main():
    # 配置参数
    movies_path = r"F:\movie"  # 修改为你的电影目录
    dry_run = False  # 设置为 True 只显示将要进行的操作
    
    # 查找 ffmpeg
    ffmpeg_path = find_ffmpeg()
    if not ffmpeg_path:
        print("错误: 未找到 ffmpeg。请安装 ffmpeg 并添加到系统 PATH")
        print("下载地址: https://ffmpeg.org/download.html")
        input("按回车键退出...")
        return
    
    print(f"找到 ffmpeg: {ffmpeg_path}")
    print(f"扫描目录: {movies_path}")
    
    # 查找所有 MKV 文件
    mkv_files = list(Path(movies_path).rglob('*.mkv'))
    
    if not mkv_files:
        print("未找到任何 MKV 文件")
        input("按回车键退出...")
        return
    
    print(f"找到 {len(mkv_files)} 个 MKV 文件")
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    # 处理文件
    for mkv_file in tqdm(mkv_files, desc="转换进度"):
        mp4_file = mkv_file.with_suffix('.mp4')
        
        # 检查 MP4 是否已存在
        if mp4_file.exists():
            print(f"\n跳过: {mkv_file.name} → MP4 已存在")
            skip_count += 1
            continue
        
        if dry_run:
            print(f"\n模拟: 将会转换 {mkv_file.name}")
            success_count += 1
            continue
        
        print(f"\n转换中: {mkv_file.name}")
        
        success = convert_mkv_to_mp4(mkv_file, mp4_file, ffmpeg_path)
        
        if success:
            print(f"成功: {mkv_file.name}")
            success_count += 1
        else:
            print(f"失败: {mkv_file.name}")
            error_count += 1
            # 删除可能生成的不完整文件
            if mp4_file.exists():
                mp4_file.unlink()
    
    # 输出统计
    print("\n" + "="*50)
    print("转换完成统计:")
    print(f"成功: {success_count}")
    print(f"跳过: {skip_count}")
    print(f"失败: {error_count}")
    
    if dry_run:
        print("\n注意: 此为模拟运行，未实际转换文件")
    
    input("\n按回车键退出...")

if __name__ == "__main__":
    main()