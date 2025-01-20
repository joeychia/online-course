export function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

export function encodeMarkdownUrls(content: string): string {
  // Replace any URLs in markdown links that contain Chinese characters
  return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    try {
      const encodedUrl = encodeURI(url);
      return `[${text}](${encodedUrl})`;
    } catch (e) {
      console.error('Error encoding URL:', e);
      return match;
    }
  });
} 