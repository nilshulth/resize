import { useMemo } from 'react'

export type AspectRatioOption = {
  id: string
  label: string
  value: number | 'original'
}

type AspectRatioSelectorProps = {
  originalWidth?: number
  originalHeight?: number
  value: AspectRatioOption['value']
  onChange: (value: AspectRatioOption['value']) => void
}

export function AspectRatioSelector({ originalWidth, originalHeight, value, onChange }: AspectRatioSelectorProps) {
  const options = useMemo<AspectRatioOption[]>(() => [
    { id: 'original', label: 'Original', value: 'original' },
    { id: '1_1', label: '1:1', value: 1 },
    { id: '16_9', label: '16:9', value: 16 / 9 },
    { id: '4_3', label: '4:3', value: 4 / 3 },
    { id: '3_2', label: '3:2', value: 3 / 2 },
  ], [])

  const effectiveLabel = (opt: AspectRatioOption) => {
    if (opt.value !== 'original') return opt.label
    if (!originalWidth || !originalHeight) return opt.label
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const g = gcd(originalWidth, originalHeight)
    return `Original (${originalWidth / g}:${originalHeight / g})`
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ color: '#444', fontSize: 14 }}>Aspect ratio</label>
      <select
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === 'original' ? 'original' : Number(v))
        }}
        style={{
          padding: '6px 10px',
          borderRadius: 4,
          border: '1px solid #ccc',
          background: 'white',
        }}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.value === 'original' ? 'original' : String(opt.value)}>
            {effectiveLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default AspectRatioSelector


