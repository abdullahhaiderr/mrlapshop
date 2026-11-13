"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayCircle, ShieldCheck } from "lucide-react";
import { customerVideoReviews } from "@/config/customer-video-reviews";
import { store } from "@/config/store";
import { getYouTubeVideoId } from "@/lib/youtube";

type VideoItem = (typeof customerVideoReviews)[number] & { videoId: string; watchUrl: string };

function VideoCard({ video, duplicate = false }: { video: VideoItem; duplicate?: boolean }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return (
    <article className="customer-video-card" aria-hidden={duplicate ? true : undefined}>
      <a
        className="customer-video-card-link"
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch ${video.title?.trim() || "customer video"} on YouTube`}
        tabIndex={duplicate ? -1 : undefined}
      >
        <div className="customer-video-frame">
          {!thumbnailFailed ? (
            // YouTube's public thumbnail endpoint avoids loading an iframe/player for every card.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              onError={() => setThumbnailFailed(true)}
            />
          ) : (
            <div className="customer-video-thumbnail-fallback" aria-hidden="true"><PlayCircle size={38} /></div>
          )}
          <span className="customer-video-play" aria-hidden="true"><PlayCircle size={48} /></span>
          <span className="customer-video-source">CUSTOMER VIDEO</span>
        </div>
        <div className="customer-video-caption">
          <h3>{video.title?.trim() || "Customer experience"}</h3>
          {video.caption && <p>{video.caption}</p>}
        </div>
      </a>
    </article>
  );
}

export function CustomerVideoSection() {
  const videos: VideoItem[] = customerVideoReviews.flatMap((video) => {
    const videoId = getYouTubeVideoId(video.youtubeUrl);
    if (!videoId) return [];
    return [{ ...video, videoId, watchUrl: `https://www.youtube.com/watch?v=${videoId}` }];
  });

  return (
    <section className="section-block customer-voice-section" id="customer-reviews">
      <div className="container">
        <div className="customer-voice-heading">
          <div>
            <span className="eyebrow">REAL CUSTOMER STORIES</span>
            <h2>Hear it from <em>our customers.</em></h2>
            <p>Watch customer videos shared on the Mr LapShop YouTube channel.</p>
          </div>
          <Link className="button button-dark customer-channel-link" href={store.socialLinks.find((item) => item.label === "YouTube")?.href ?? "https://www.youtube.com/"} target="_blank" rel="noopener noreferrer">
            <PlayCircle size={17} /> Visit our YouTube channel
          </Link>
        </div>

        {videos.length > 0 ? (
          <div className="customer-video-marquee" aria-label="Customer video testimonials. Hover or focus to pause the carousel.">
            <div className="customer-video-track">
              {videos.map((video, index) => <VideoCard key={`${video.videoId}-${index}`} video={video} />)}
              {videos.map((video, index) => <VideoCard key={`duplicate-${video.videoId}-${index}`} video={video} duplicate />)}
            </div>
          </div>
        ) : (
          <div className="customer-video-empty card-depth">
            <span className="customer-video-empty-icon"><PlayCircle size={30} /></span>
            <div><strong>Customer videos will appear here</strong><p>No valid YouTube video links are currently configured.</p></div>
            <div className="customer-video-trust"><ShieldCheck size={18} /><span>Only genuine customer videos, shared with permission.</span></div>
          </div>
        )}
      </div>
    </section>
  );
}
