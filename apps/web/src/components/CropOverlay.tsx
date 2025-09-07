import { useEffect, useRef, useState } from 'react'

type CropRect = { x: number; y: number; width: number; height: number }

type CropOverlayProps = {
  containerWidth: number
  containerHeight: number
  imageBox: { left: number; top: number; width: number; height: number }
  aspect: number | 'original'
  onChange?: (rect: CropRect) => void
}

export default function CropOverlay({ containerWidth, containerHeight, imageBox, aspect, onChange }: CropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<CropRect>(() => {
    const iw = imageBox.width
    const ih = imageBox.height
    const ratio = iw / ih
    let w = iw * 0.8
    let h = w / ratio
    if (aspect !== 'original') {
      if (w / h > aspect) w = h * aspect
      else h = w / aspect
    }
    const x = imageBox.left + (iw - w) / 2
    const y = imageBox.top + (ih - h) / 2
    return { x, y, width: w, height: h }
  })

  useEffect(() => { onChange?.(rect) }, [rect, onChange])

  useEffect(() => {
    // Recenter on aspect change
    const iw = imageBox.width
    const ih = imageBox.height
    const ratio = iw / ih
    let w = rect.width
    let h = rect.height
    if (aspect !== 'original') {
      // fit current rect to aspect while keeping center
      const cx = rect.x + rect.width / 2
      const cy = rect.y + rect.height / 2
      if (w / h > aspect) w = h * aspect
      else h = w / aspect
      setRect({ x: cx - w / 2, y: cy - h / 2, width: w, height: h })
    } else {
      // keep within image bounds
      const maxW = iw
      const maxH = maxW / ratio
      const cx = rect.x + rect.width / 2
      const cy = rect.y + rect.height / 2
      w = Math.min(rect.width, maxW)
      h = Math.min(rect.height, maxH)
      setRect({ x: Math.max(imageBox.left, cx - w / 2), y: Math.max(imageBox.top, cy - h / 2), width: w, height: h })
    }
  }, [aspect, imageBox])

  // Keep latest values in refs to avoid re-binding listeners on each render
  const rectRef = useRef(rect)
  useEffect(() => { rectRef.current = rect }, [rect])
  const cwRef = useRef(containerWidth)
  useEffect(() => { cwRef.current = containerWidth }, [containerWidth])
  const chRef = useRef(containerHeight)
  useEffect(() => { chRef.current = containerHeight }, [containerHeight])
  const ibRef = useRef(imageBox)
  useEffect(() => { ibRef.current = imageBox }, [imageBox])
  const aspectRef = useRef(aspect)
  useEffect(() => { aspectRef.current = aspect }, [aspect])

  // Dragging logic (listeners bound once)
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    let mode: 'move' | 'resize' | null = null
    let startX = 0, startY = 0
    let startRect = rectRef.current
    let handle: 'nw'|'ne'|'sw'|'se'|null = null

    const getHandle = (e: MouseEvent): typeof handle => {
      const target = e.target as HTMLElement
      if (!target) return null
      if (target.dataset.handle === 'nw') return 'nw'
      if (target.dataset.handle === 'ne') return 'ne'
      if (target.dataset.handle === 'sw') return 'sw'
      if (target.dataset.handle === 'se') return 'se'
      return null
    }

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      const h = getHandle(e)
      if (h) {
        mode = 'resize'
        handle = h
      } else {
        mode = 'move'
      }
      startX = e.clientX
      startY = e.clientY
      startRect = { ...rectRef.current }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (mode === 'move') {
        const bounds = ibRef.current
        const nx = clamp(startRect.x + dx, bounds.left, bounds.left + bounds.width - startRect.width)
        const ny = clamp(startRect.y + dy, bounds.top, bounds.top + bounds.height - startRect.height)
        setRect(r => ({ ...r, x: nx, y: ny }))
      } else if (mode === 'resize' && handle) {
        const aspect = aspectRef.current === 'original' ? (ibRef.current.width / ibRef.current.height) : (aspectRef.current as number)
        const minSize = 20
        const bounds = ibRef.current

        // Desired size change based on handle movement
        let desiredW = startRect.width
        let desiredH = startRect.height
        if (handle === 'se') { desiredW = startRect.width + dx; desiredH = startRect.height + dy }
        if (handle === 'ne') { desiredW = startRect.width + dx; desiredH = startRect.height - dy }
        if (handle === 'sw') { desiredW = startRect.width - dx; desiredH = startRect.height + dy }
        if (handle === 'nw') { desiredW = startRect.width - dx; desiredH = startRect.height - dy }

        // Ensure positive sizes before aspect enforcement
        desiredW = Math.max(minSize, desiredW)
        desiredH = Math.max(minSize, desiredH)

        // Project desired size to maintain aspect
        let projW: number
        let projH: number
        if (desiredW / desiredH > aspect) {
          projW = desiredH * aspect
          projH = desiredH
        } else {
          projW = desiredW
          projH = desiredW / aspect
        }

        // Determine anchor point and max sizes from anchor to bounds
        let anchorX = startRect.x
        let anchorY = startRect.y
        if (handle === 'se') { anchorX = startRect.x; anchorY = startRect.y }
        if (handle === 'ne') { anchorX = startRect.x; anchorY = startRect.y + startRect.height }
        if (handle === 'sw') { anchorX = startRect.x + startRect.width; anchorY = startRect.y }
        if (handle === 'nw') { anchorX = startRect.x + startRect.width; anchorY = startRect.y + startRect.height }

        let maxW = 0
        let maxH = 0
        if (handle === 'se') { maxW = (bounds.left + bounds.width) - anchorX; maxH = (bounds.top + bounds.height) - anchorY }
        if (handle === 'ne') { maxW = (bounds.left + bounds.width) - anchorX; maxH = anchorY - bounds.top }
        if (handle === 'sw') { maxW = anchorX - bounds.left; maxH = (bounds.top + bounds.height) - anchorY }
        if (handle === 'nw') { maxW = anchorX - bounds.left; maxH = anchorY - bounds.top }

        // Clamp by bounds while keeping aspect: try width-first, then height-first
        let w = Math.min(Math.max(projW, minSize), maxW)
        let h = w / aspect
        if (h > maxH) {
          h = Math.min(Math.max(projH, minSize), maxH)
          w = h * aspect
        }

        // Derive x,y from anchor and final size
        let x = 0
        let y = 0
        if (handle === 'se') { x = anchorX; y = anchorY }
        if (handle === 'ne') { x = anchorX; y = anchorY - h }
        if (handle === 'sw') { x = anchorX - w; y = anchorY }
        if (handle === 'nw') { x = anchorX - w; y = anchorY - h }

        setRect({ x, y, width: w, height: h })
      }
    }

    const onMouseUp = () => {
      mode = null
      handle = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    el.addEventListener('mousedown', onMouseDown)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute', left: 0, top: 0, width: containerWidth, height: containerHeight,
        cursor: 'move',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: rect.x, top: rect.y, width: rect.width, height: rect.height,
          outline: '2px solid #00a3ff', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
        }}
      >
        {(['nw','ne','sw','se'] as const).map(h => (
          <div
            key={h}
            data-handle={h}
            style={{
              position: 'absolute', width: 12, height: 12, background: '#00a3ff', borderRadius: 2,
              left: h.includes('w') ? -6 : undefined,
              right: h.includes('e') ? -6 : undefined,
              top: h.includes('n') ? -6 : undefined,
              bottom: h.includes('s') ? -6 : undefined,
              cursor: h + '-resize',
            }}
          />
        ))}
      </div>
    </div>
  )
}


