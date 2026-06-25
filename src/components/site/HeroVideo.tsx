/**
 * Fullscreen background video for the homepage hero.
 * Always muted — no audio track.
 */
export default function HeroVideo() {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src="/videos/hero.mp4?v=4"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="Legson Media commercial video showing framing and construction work"
    />
  );
}
