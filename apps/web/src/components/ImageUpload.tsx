import { useEffect, useRef, useState, useCallback } from 'react'
import AspectRatioSelector, { TARGETS } from './AspectRatioSelector'
import CropOverlay from './CropOverlay'

interface UploadedFile {
  file: File
  preview: string
}

// Minimal EXIF parser to read DateTimeOriginal (0x9003) from JPEGs
async function readExifDateTaken(file: File): Promise<string | null> {
  try {
    if (file.type !== 'image/jpeg') return null
    const buffer = await file.arrayBuffer()
    const view = new DataView(buffer)
    // JPEG SOI
    if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) return null
    let offset = 2
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xFF) break
      const marker = view.getUint8(offset + 1)
      const size = view.getUint16(offset + 2, false)
      if (marker === 0xE1) { // APP1
        const start = offset + 4
        // Check Exif header
        if (start + 6 <= view.byteLength) {
          const exifStr = String.fromCharCode(
            view.getUint8(start), view.getUint8(start + 1), view.getUint8(start + 2),
            view.getUint8(start + 3), view.getUint8(start + 4), view.getUint8(start + 5)
          )
          if (exifStr === 'Exif\u0000\u0000' || exifStr === 'Exif\x00\x00') {
            const tiffBase = start + 6
            if (tiffBase + 8 > view.byteLength) return null
            const little = (String.fromCharCode(view.getUint8(tiffBase)) === 'I')
            const getU16 = (off: number) => view.getUint16(off, little)
            const getU32 = (off: number) => view.getUint32(off, little)
            const ifd0Offset = getU32(tiffBase + 4)
            const ifd0 = tiffBase + ifd0Offset
            const readAscii = (valueOff: number, count: number): string => {
              const startOff = count > 4 ? (tiffBase + valueOff) : valueOff
              let s = ''
              for (let i = 0; i < count && (startOff + i) < view.byteLength; i++) {
                const ch = view.getUint8(startOff + i)
                if (ch === 0) break
                s += String.fromCharCode(ch)
              }
              return s
            }
            const findTagInIfd = (ifdOff: number, tagToFind: number): { type: number; count: number; valueOff: number } | null => {
              if (ifdOff + 2 > view.byteLength) return null
              const num = getU16(ifdOff)
              let entry = ifdOff + 2
              for (let i = 0; i < num; i++) {
                if (entry + 12 > view.byteLength) break
                const tag = getU16(entry)
                const type = getU16(entry + 2)
                const count = getU32(entry + 4)
                const valueOff = getU32(entry + 8)
                if (tag === tagToFind) return { type, count, valueOff }
                entry += 12
              }
              return null
            }

            // Try DateTimeOriginal in ExifIFD (pointed by 0x8769 in IFD0)
            const exifPtr = findTagInIfd(ifd0, 0x8769)
            if (exifPtr) {
              const exifIfd = tiffBase + exifPtr.valueOff
              const dto = findTagInIfd(exifIfd, 0x9003)
              if (dto && dto.type === 2 /* ASCII */) {
                const s = readAscii(dto.valueOff, dto.count)
                return s || null
              }
            }
            // Fallback: DateTime in IFD0 (0x0132)
            const dt = findTagInIfd(ifd0, 0x0132)
            if (dt && dt.type === 2) {
              const s = readAscii(dt.valueOff, dt.count)
              return s || null
            }
          }
        }
      }
      if (size < 2) break
      offset += 2 + size
    }
    return null
  } catch {
    return null
  }
}

function formatExifDate(s: string | null): string {
  if (!s) return ''
  // EXIF: YYYY:MM:DD HH:MM:SS
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return s
  const [, y, mo, d, h, mi] = m
  return `${y}-${mo}-${d} ${h}:${mi}`
}

export default function ImageUpload() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<string>(TARGETS[0]?.id ?? '')
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [imageBox, setImageBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const [meta, setMeta] = useState<{ dateTaken: string | null; naturalWidth?: number; naturalHeight?: number }>({ dateTaken: null })

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP)')
      return false
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return false
    }

    return true
  }

  const handleFile = useCallback((file: File) => {
    setError(null)
    
    if (!validateFile(file)) {
      return
    }

    const preview = URL.createObjectURL(file)
    setUploadedFile({ file, preview })
    // Reset meta and try to read EXIF Date Taken (JPEG only)
    setMeta({ dateTaken: null })
    readExifDateTaken(file).then((dt) => {
      setMeta((m) => ({ ...m, dateTaken: dt }))
    }).catch(() => {
      setMeta((m) => ({ ...m, dateTaken: null }))
    })
  }, [])

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect
        setContainerSize({ width: cr.width, height: cr.height })
        // also recompute image box on container resize
        if (containerRef.current && imgRef.current) {
          const c = containerRef.current.getBoundingClientRect()
          const i = imgRef.current.getBoundingClientRect()
          setImageBox({ left: i.left - c.left, top: i.top - c.top, width: i.width, height: i.height })
        }
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const clearFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
    setUploadedFile(null)
    setError(null)
  }

  return (
    <div>
      {!uploadedFile ? (
        <div
          style={{
            border: `2px dashed ${dragActive ? '#0066cc' : '#ccc'}`,
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f0f8ff' : 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
            {dragActive ? 'Drop your image here' : 'Drag and drop an image here'}
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#666' }}>
            or click to select a file
          </p>
          <p style={{ margin: '0', color: '#999', fontSize: '14px' }}>
            Supports JPG, PNG, WebP (max 10MB)
          </p>
          
          <input
            id="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0', color: '#333' }}>Uploaded Image</h3>
            <button
              onClick={clearFile}
              style={{
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <AspectRatioSelector
              value={selectedTargetId}
              onChange={setSelectedTargetId}
            />
            {cropRect && imageBox && (() => {
              const target = TARGETS.find(t => t.id === selectedTargetId) ?? TARGETS[0]
              const img = imgRef.current
              if (!img) return null
              
              // Calculate crop area in natural image pixels
              const displayedWidth = img.width
              const displayedHeight = img.height
              const scaleX = img.naturalWidth / displayedWidth
              const scaleY = img.naturalHeight / displayedHeight
              const naturalCropWidth = cropRect.width * scaleX
              const naturalCropHeight = cropRect.height * scaleY
              
              // Quality factor: how much we need to scale the crop to reach target size
              const scaleFactorX = target.width / naturalCropWidth
              const scaleFactorY = target.height / naturalCropHeight
              const maxScaleFactor = Math.max(scaleFactorX, scaleFactorY)
              
              let qualityText = ''
              let qualityColor = ''
              let thermometerFill = 0
              
              if (maxScaleFactor <= 0.5) {
                qualityText = 'Excellent (downsizing)'
                qualityColor = '#22c55e'
                thermometerFill = 100
              } else if (maxScaleFactor <= 1.0) {
                qualityText = 'Very good'
                qualityColor = '#16a34a'
                thermometerFill = 85
              } else if (maxScaleFactor <= 1.5) {
                qualityText = 'Good'
                qualityColor = '#84cc16'
                thermometerFill = 70
              } else if (maxScaleFactor <= 2.0) {
                qualityText = 'Acceptable'
                qualityColor = '#eab308'
                thermometerFill = 50
              } else if (maxScaleFactor <= 3.0) {
                qualityText = 'Poor quality'
                qualityColor = '#f97316'
                thermometerFill = 30
              } else {
                qualityText = 'Very poor quality'
                qualityColor = '#ef4444'
                thermometerFill = 15
              }
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Kvalitet:</span>
                  <div style={{ 
                    width: 80, height: 16, 
                    background: '#e5e7eb', 
                    borderRadius: 8, 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      width: `${thermometerFill}%`, 
                      height: '100%', 
                      background: qualityColor,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 14, color: qualityColor, fontWeight: 500 }}>
                    {qualityText}
                  </span>
                  <span style={{ fontSize: 12, color: '#999' }}>
                    ({maxScaleFactor > 1 ? `${maxScaleFactor.toFixed(1)}x upscale` : `${(1/maxScaleFactor).toFixed(1)}x downscale`})
                  </span>
                </div>
              )
            })()}
            <button
              onClick={() => doCrop()}
              style={{
                background: '#0070f3', color: 'white', border: 'none', borderRadius: 4,
                padding: '8px 14px', cursor: 'pointer'
              }}
            >Crop</button>
          </div>
          
          <div ref={containerRef} style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden', borderRadius: 4 }}>
            <img
              ref={imgRef}
              src={uploadedFile.preview}
              alt="Uploaded preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '4px',
                display: 'block',
                margin: '0 auto'
              }}
              onLoad={() => {
                // trigger container measurement
                if (containerRef.current) {
                  const r = containerRef.current.getBoundingClientRect()
                  setContainerSize({ width: r.width, height: r.height })
                }
                if (containerRef.current && imgRef.current) {
                  const c = containerRef.current.getBoundingClientRect()
                  const i = imgRef.current.getBoundingClientRect()
                  setImageBox({ left: i.left - c.left, top: i.top - c.top, width: i.width, height: i.height })
                }
                if (imgRef.current) {
                  setMeta((m) => ({ ...m, naturalWidth: imgRef.current!.naturalWidth, naturalHeight: imgRef.current!.naturalHeight }))
                }
              }}
            />
            {imgRef.current && imageBox && (
              <CropOverlay
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                imageBox={imageBox}
                aspect={(function() {
                  const t = TARGETS.find(t => t.id === selectedTargetId) ?? TARGETS[0]
                  return t.width / t.height
                })()}
                onChange={setCropRect}
              />
            )}
          </div>
          
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>File Info:</strong><br />
            Name: {uploadedFile.file.name}<br />
            Date taken: {formatExifDate(meta.dateTaken) || '—'}<br />
            Dimensions: {meta.naturalWidth && meta.naturalHeight ? `${meta.naturalWidth} x ${meta.naturalHeight} px` : '—'}<br />
            Size: {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB<br />
            Type: {uploadedFile.file.type}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ffcccc',
          borderRadius: '4px',
          color: '#cc0000'
        }}>
          {error}
        </div>
      )}
    </div>
  )

  function doCrop() {
    if (!uploadedFile || !imgRef.current || !cropRect || !containerRef.current || !imageBox) return
    const img = imgRef.current
    // translate cropRect from displayed coordinates to natural image pixels
    const displayedWidth = img.width
    const displayedHeight = img.height
    const scaleX = img.naturalWidth / displayedWidth
    const scaleY = img.naturalHeight / displayedHeight

    // rect is in container coords; convert to image-relative coords first
    const relX = cropRect.x - imageBox.left
    const relY = cropRect.y - imageBox.top

    const sx = Math.max(0, Math.round(relX * scaleX))
    const sy = Math.max(0, Math.round(relY * scaleY))
    const sw = Math.min(img.naturalWidth - sx, Math.round(cropRect.width * scaleX))
    const sh = Math.min(img.naturalHeight - sy, Math.round(cropRect.height * scaleY))

    const target = TARGETS.find(t => t.id === selectedTargetId) ?? TARGETS[0]
    const outW = target.width
    const outH = target.height

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ;(ctx as any).imageSmoothingQuality = 'high'
    // Draw the selected crop area scaled to the target output size
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

    const allowedMimes = ['image/jpeg','image/png','image/webp'] as const
    const srcMime = allowedMimes.includes(uploadedFile.file.type as any) ? uploadedFile.file.type : 'image/png'
    const quality = (srcMime === 'image/jpeg' || srcMime === 'image/webp') ? 0.92 : undefined
    const dataUrl = quality !== undefined ? canvas.toDataURL(srcMime, quality) : canvas.toDataURL(srcMime)

    const originalName = uploadedFile.file.name
    const dotIndex = originalName.lastIndexOf('.')
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName
    const ext = srcMime === 'image/jpeg' ? 'jpg' : (srcMime === 'image/webp' ? 'webp' : 'png')

    const a = document.createElement('a')
    a.href = dataUrl
    const targetName = target.name
    a.download = `${baseName}-${targetName}-${target.width}x${target.height}.${ext}`
    a.click()
  }
}

