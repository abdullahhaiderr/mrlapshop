import { describe, expect, it } from "vitest";
import { getYouTubeEmbedUrl, getYouTubeVideoId, isYouTubeShortsUrl } from "@/lib/youtube";

describe("YouTube URL parsing", () => {
  const id = "dQw4w9WgXcQ";

  it("reads standard watch URLs", () => {
    expect(getYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
  });

  it("reads short URLs", () => {
    expect(getYouTubeVideoId(`https://youtu.be/${id}`)).toBe(id);
  });

  it("reads Shorts and embed URLs", () => {
    expect(getYouTubeVideoId(`https://youtube.com/shorts/${id}`)).toBe(id);
    expect(getYouTubeVideoId(`https://www.youtube.com/embed/${id}`)).toBe(id);
  });

  it("rejects unrelated or malformed URLs", () => {
    expect(getYouTubeVideoId("https://example.com/watch?v=12345678901")).toBeNull();
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=too-short")).toBeNull();
    expect(getYouTubeVideoId("not a url")).toBeNull();
  });

  it("detects Shorts links for portrait framing", () => {
    expect(isYouTubeShortsUrl(`https://www.youtube.com/shorts/${id}`)).toBe(true);
    expect(isYouTubeShortsUrl(`https://youtu.be/${id}`)).toBe(false);
  });

  it("returns privacy-enhanced embed URLs", () => {
    expect(getYouTubeEmbedUrl(`https://youtu.be/${id}`)).toBe(
      `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    );
  });
});
