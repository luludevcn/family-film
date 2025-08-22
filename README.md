This project is build for family-shared movies.

For my wife, when she does not have VIP for any movies, I can share the movie in my PC disks, then anyone in the wifi scope can watch movies by the application.

## Getting Started

First, clone the repo by

```
git clone ...
```

Second, config the movie folder

```bash
MOVIE_DIR = "F:\movie"
```
the folder should be like this
```
movie/
├── [movie-tag1]/
│   ├── m01.mp4
│   ├── m02.mp4
│   └── m03.mp4
|   └── metadata.json
|
├── [movie-tag2]/
├── [movie-tag3]/
```
and then run the commonds:

```bash
cd family-film

npm install

npm run dev
```

Now you can open [http://your-pc-ip:3000](http://your-pc-ip:3000) with any browsers to watch the movies.

