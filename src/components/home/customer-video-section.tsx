"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { PlayCircle, ShieldCheck, X, Star } from "lucide-react";
import { store } from "@/config/store";
import type { PublicVideoTestimonial } from "@/lib/testimonials";

function VideoCard({
  video,
  duplicate = false,
  onPlay,
}: {
  video: PublicVideoTestimonial;
  duplicate?: boolean;
  onPlay: (video: PublicVideoTestimonial, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  return (
    <article className="customer-video-card" aria-hidden={duplicate ? true : undefined}>
      <button
        className="customer-video-card-link"
        type="button"
        onClick={(event) => onPlay(video, event)}
        aria-label={`Play ${video.headline || "customer video"} by ${video.displayName}`}
        tabIndex={duplicate ? -1 : 0}
      >
        <div className="customer-video-frame">
          {!thumbnailFailed ? (
            // YouTube thumbnails keep the marquee light; the player is loaded only after a click.
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
          <h3>{video.headline}</h3>
          <span className="customer-video-author">{video.displayName}</span>
          {video.rating && <span className="customer-video-rating" aria-label={`${video.rating} out of 5 stars`}>{Array.from({ length: video.rating }, (_, index) => <Star key={index} size={11} fill="currentColor" />)}</span>}
          {video.reviewText && <p>{video.reviewText}</p>}
        </div>
      </button>
    </article>
  );
}

export function CustomerVideoSection({ videos }: { videos: PublicVideoTestimonial[] }) {
  const [activeVideo, setActiveVideo] = useState<PublicVideoTestimonial | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!activeVideo) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        triggerRef.current?.focus();
      }
      return;
    }

    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveVideo(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeVideo]);

  function openVideo(video: PublicVideoTestimonial, event: MouseEvent<HTMLButtonElement>) {
    triggerRef.current = event.currentTarget;
    setActiveVideo(video);
  }

  function closeVideo() {
    setActiveVideo(null);
  }

  return (
    <section className="section-block customer-voice-section" id="customer-reviews">
      <div className="container">
        <div className="customer-voice-heading">
          <div>
            <span className="eyebrow">REAL CUSTOMER STORIES</span>
            <h2>Hear it from <em>our customers.</em></h2>
            <p>Watch genuine customer videos shared with Mr LapShop&apos;s permission.</p>
          </div>
          <Link className="button button-dark customer-channel-link" href={store.socialLinks.find((item) => item.label === "YouTube")?.href ?? "https://www.youtube.com/"} target="_blank" rel="noopener noreferrer">
            <PlayCircle size={17} /> Visit our YouTube channel
          </Link>
        </div>

        {videos.length > 0 ? (
          <div className="customer-video-marquee" aria-label="Customer video testimonials. Hover, focus or tap a video to pause the carousel.">
            <div className="customer-video-track">
              {videos.map((video) => <VideoCard key={video.id} video={video} onPlay={openVideo} />)}
              {videos.map((video) => <VideoCard key={`duplicate-${video.id}`} video={video} duplicate onPlay={openVideo} />)}
            </div>
          </div>
        ) : (
          <div className="customer-video-empty card-depth">
            <span className="customer-video-empty-icon"><PlayCircle size={30} /></span>
            <div><strong>Customer videos will appear here</strong><p>Approved customer videos will be published here by the Mr LapShop team.</p></div>
            <div className="customer-video-trust"><ShieldCheck size={18} /><span>Only customer videos approved for publication are shown.</span></div>
          </div>
        )}
      </div>

      {activeVideo && (
        <div className="customer-video-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeVideo(); }}>
          <section className="customer-video-modal" role="dialog" aria-modal="true" aria-labelledby="customer-video-modal-title">
            <div className="customer-video-modal-heading">
              <div>
                <span className="eyebrow">CUSTOMER VIDEO</span>
                <h2 id="customer-video-modal-title">{activeVideo.headline}</h2>
                <p>{activeVideo.displayName}</p>
              </div>
              <button className="customer-video-modal-close" type="button" ref={closeButtonRef} onClick={closeVideo} aria-label="Close video"><X size={21} /></button>
            </div>
            <div className={`customer-video-modal-player ${activeVideo.youtubeUrl.includes("/shorts/") ? "is-portrait" : ""}`}>
              <iframe
                key={activeVideo.id}
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideo.headline}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            {activeVideo.reviewText && <p className="customer-video-modal-review">{activeVideo.reviewText}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
