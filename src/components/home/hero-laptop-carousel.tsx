"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const heroLaptopSlides = [
  { src: "/images/laptop-03.webp", alt: "Gaming laptop with colourful backlit keyboard" },
  { src: "/images/laptop-01.webp", alt: "Slim silver laptop" },
  { src: "/images/laptop-02.webp", alt: "Modern laptop viewed from the front" },
  { src: "/images/laptop-04.webp", alt: "Silver convertible laptop" },
  { src: "/images/laptop-05.webp", alt: "Two-in-one convertible laptop" },
  { src: "/images/laptop-06.webp", alt: "Dark performance laptop" },
];

export function HeroLaptopCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroLaptopSlides.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="hero-image-frame" role="group" aria-label="Featured laptop image carousel">
      {heroLaptopSlides.map((slide, index) => (
        <div
          className={`hero-image-slide${index === activeIndex ? " is-active" : ""}`}
          key={slide.src}
          aria-hidden={index !== activeIndex}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 620px) 83vw, (max-width: 960px) 48vw, 490px"
            priority={index === 0}
            className="hero-laptop-image"
          />
        </div>
      ))}
      <span className="sr-only" aria-live="off">Laptop image {activeIndex + 1} of {heroLaptopSlides.length}</span>
    </div>
  );
}
