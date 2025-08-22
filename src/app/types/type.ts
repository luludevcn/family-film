interface VideoFiles {
    categories: Category[];
}

interface Category {
    name: string;
    label: string;
    videos: string[];
}