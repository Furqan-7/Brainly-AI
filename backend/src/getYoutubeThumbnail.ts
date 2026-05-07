export function getYoutubeThumbnail(url: string) {
    const regex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&]+)/;

    const match = url.match(regex);

    if (!match) return null;

    const videoId = match[1];

    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}