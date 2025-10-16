export const getEmbedUrl = (url: string | null | undefined, showControls = false): { url: string, type: 'iframe' | 'video' } => {
    if (!url) return { url: '', type: 'video' };

    try {
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            const controls = showControls ? 1 : 0;
            return { url: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=${controls}&showinfo=0`, type: 'iframe' };
        }
        if (url.includes('vimeo.com')) {
            const videoId = new URL(url).pathname.split('/').pop();
            const background = showControls ? 0 : 1;
            return { url: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&autopause=0&background=${background}`, type: 'iframe' };
        }
    } catch (e) {
        console.error("Invalid URL for video embed:", e);
        return { url: '', type: 'video' };
    }
    
    return { url, type: 'video' }; // Direct link for .mp4, etc.
};

interface VideoDetails {
    thumbnailUrl: string;
    duration: number | null; // duration in seconds
}

const videoDetailsCache: { [key: string]: VideoDetails } = {};

export const getVideoDetails = async (url: string | null | undefined): Promise<VideoDetails> => {
    if (!url) return { thumbnailUrl: 'https://placehold.co/128x72.png?text=Aula', duration: null };
    if (videoDetailsCache[url]) {
        return videoDetailsCache[url];
    }

    let details: VideoDetails = { thumbnailUrl: 'https://placehold.co/128x72.png?text=Aula', duration: null };

    try {
        if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
            const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|v\/|embed\/|watch\?v=)|youtu\.be\/)([^"&?\/ ]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            details.thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://placehold.co/128x72.png?text=YouTube';
            details.duration = null; 
        } else if (url.includes('vimeo.com')) {
            try {
                const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
                if (response.ok) {
                    const data = await response.json();
                    details.thumbnailUrl = data.thumbnail_url || 'https://placehold.co/128x72.png?text=Vimeo';
                    details.duration = data.duration || null;
                } else {
                    details.thumbnailUrl = 'https://placehold.co/128x72.png?text=Vimeo';
                }
            } catch (apiError) {
                console.error("Vimeo details fetch error:", apiError);
                details.thumbnailUrl = 'https://placehold.co/128x72.png?text=Vimeo';
            }
        }
    } catch (e) {
        console.error("Invalid URL for video details generation:", e);
    }
    
    videoDetailsCache[url] = details;
    return details;
};

export const getThumbnailUrl = async (url: string | null | undefined): Promise<string> => {
    const details = await getVideoDetails(url);
    return details.thumbnailUrl;
};