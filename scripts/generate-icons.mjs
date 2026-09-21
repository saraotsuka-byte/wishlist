// 依存パッケージを増やさず、PWA用アイコン(PNG)をNode標準のzlibだけで生成するワンショットスクリプト。
// 実行後は不要になるため、生成物(public/icons/*.png)だけをコミットしメンテナンス対象にはしない。
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BRAND = [0x25, 0x63, 0xeb] // #2563eb
const WHITE = [0xff, 0xff, 0xff]

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw)

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4)
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = a
  }

  const radius = size * 0.18
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x < radius ? radius : x > size - radius ? size - radius : x
      const cy = y < radius ? radius : y > size - radius ? size - radius : y
      const dx = x - cx
      const dy = y - cy
      const corner = (x < radius || x > size - radius) && (y < radius || y > size - radius)
      if (corner && dx * dx + dy * dy > radius * radius) continue
      set(x, y, BRAND)
    }
  }

  // シンプルな買い物かごのシルエット（台形 + 取っ手の弧）
  const top = size * 0.34
  const bottom = size * 0.72
  const topHalfWidth = size * 0.14
  const bottomHalfWidth = size * 0.26
  const centerX = size / 2
  const stroke = Math.max(2, size * 0.035)

  for (let y = Math.round(top); y <= Math.round(bottom); y++) {
    const t = (y - top) / (bottom - top)
    const halfWidth = topHalfWidth + (bottomHalfWidth - topHalfWidth) * t
    const left = Math.round(centerX - halfWidth)
    const right = Math.round(centerX + halfWidth)
    for (let x = left; x <= right; x++) {
      const nearEdge = x - left < stroke || right - x < stroke
      const nearBottom = bottom - y < stroke
      if (nearEdge || nearBottom) set(x, y, WHITE)
    }
  }

  // 取っ手（半円弧）
  const handleRadius = size * 0.15
  const handleCenterY = top - handleRadius * 0.35
  for (let angle = 180; angle <= 360; angle += 1) {
    const rad = (angle * Math.PI) / 180
    for (let w = 0; w < stroke; w++) {
      const r = handleRadius - w
      const x = Math.round(centerX + r * Math.cos(rad))
      const y = Math.round(handleCenterY + r * Math.sin(rad))
      set(x, y, WHITE)
    }
  }

  return encodePng(size, size, rgba)
}

mkdirSync('public/icons', { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, makeIcon(size))
  console.log(`generated public/icons/icon-${size}.png`)
}
