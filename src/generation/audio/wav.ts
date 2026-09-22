/** Encodes a rendered AudioBuffer as a 16-bit PCM WAV blob. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels
  const frames = buffer.length
  const bytesPerSample = 2
  const blockAlign = channels * bytesPerSample
  const dataBytes = frames * blockAlign
  const view = new DataView(new ArrayBuffer(44 + dataBytes))

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 8 * bytesPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataBytes, true)

  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c))
  let offset = 44
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, data[channel][frame]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([view.buffer], { type: 'audio/wav' })
}

/** Downsamples a buffer into N peak values for the waveform display. */
export function peaks(buffer: AudioBuffer, count: number): number[] {
  const data = buffer.getChannelData(0)
  const block = Math.floor(data.length / count) || 1
  const out: number[] = []
  let max = 0.0001

  for (let i = 0; i < count; i += 1) {
    let peak = 0
    const start = i * block
    for (let j = 0; j < block; j += 64) {
      const value = Math.abs(data[start + j] ?? 0)
      if (value > peak) peak = value
    }
    out.push(peak)
    if (peak > max) max = peak
  }

  return out.map((value) => Math.max(0.04, value / max))
}
