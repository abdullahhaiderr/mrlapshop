const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/** Extracts a safe YouTube video ID from watch, short, shorts or embed URLs. */
export function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (host !== "youtube.com" && host !== "youtube-nocookie.com") {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const id = url.pathname === "/watch"
      ? url.searchParams.get("v") ?? ""
      : ["shorts", "embed", "live", "v"].includes(segments[0] ?? "")
        ? segments[1] ?? ""
        : "";

    return YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}


/** Detects vertical Shorts links so the video card can use a portrait frame automatically. */
export function isYouTubeShortsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    return (host === "youtube.com" || host === "youtube-nocookie.com")
      && url.pathname.split("/").filter(Boolean)[0] === "shorts";
  } catch {
    return false;
  }
}
