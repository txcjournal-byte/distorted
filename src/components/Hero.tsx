import { DistressedTitle } from './DistressedTitle'

export function Hero() {
  return (
    <section className="hero">
      <p className="hero__scrawl" aria-hidden="true">
        Real
        <br />
        artists
        <br />
        real
        <br />
        sound
        <br />
        no limits
      </p>

      <DistressedTitle text="DISTORTED" uid="hero" className="hero__logo" scratches />

      <h1 className="hero__headline">GENERATE SONG BY ARTIST STYLE</h1>
      <p className="hero__chip">DIFFERENT MINDS · SAME NOISE</p>
    </section>
  )
}
