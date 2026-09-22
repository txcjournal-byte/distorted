/** Full-screen film grain + scanlines + vignette. Purely decorative. */
export function GrainOverlay() {
  return (
    <div className="overlay" aria-hidden="true">
      <svg className="overlay__grain" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
      <div className="overlay__scanlines" />
      <div className="overlay__vignette" />
    </div>
  )
}
