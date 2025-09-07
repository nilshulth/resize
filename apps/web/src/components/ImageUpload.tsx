import { useEffect, useRef, useState, useCallback } from 'react'
import AspectRatioSelector, { AspectRatioOption } from './AspectRatioSelector'
import CropOverlay from './CropOverlay'

interface UploadedFile {
  file: File
  preview: string
}

export default function ImageUpload() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aspect, setAspect] = useState<AspectRatioOption['value']>('original')
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [imageBox, setImageBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

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
              value={aspect}
              onChange={setAspect}
              originalWidth={imgRef.current?.naturalWidth}
              originalHeight={imgRef.current?.naturalHeight}
            />
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
              }}
            />
            {imgRef.current && imageBox && (
              <CropOverlay
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                imageBox={imageBox}
                aspect={aspect}
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
    if (!uploadedFile || !imgRef.current || !cropRect || !containerRef.current) return
    const img = imgRef.current
    // translate cropRect from displayed coordinates to natural image pixels
    const displayedWidth = img.width
    const displayedHeight = img.height
    const scaleX = img.naturalWidth / displayedWidth
    const scaleY = img.naturalHeight / displayedHeight

    const sx = Math.max(0, Math.round(cropRect.x * scaleX))
    const sy = Math.max(0, Math.round(cropRect.y * scaleY))
    const sw = Math.min(img.naturalWidth - sx, Math.round(cropRect.width * scaleX))
    const sh = Math.min(img.naturalHeight - sy, Math.round(cropRect.height * scaleY))

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'crop.png'
    a.click()
  }
}

