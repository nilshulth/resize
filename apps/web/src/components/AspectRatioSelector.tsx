export type TargetOption = {
  id: string
  name: string
  width: number
  height: number
}

export const TARGETS: TargetOption[] = [
  { id: 'toppbild-1932x828', name: 'Toppbild', width: 1932, height: 828 },
  { id: 'brodtextbild-1200x800', name: 'Brödtextbild', width: 1200, height: 800 },
  { id: 'linkedin-liggande-1200x628', name: 'LinkedIn, liggande', width: 1200, height: 628 },
  { id: 'linkedin-kvadratisk-1200x1200', name: 'LinkedIn, kvadratisk', width: 1200, height: 1200 },
  { id: 'linkedin-staende-4-5-1200x628', name: 'LinkedIn, stående (4:5)', width: 1200, height: 628 },
  { id: 'instagram-kvadratisk-1080x1080', name: 'Instagram, kvadratisk', width: 1080, height: 1080 },
  { id: 'instagram-staende-4-5-1080x1350', name: 'Instagram, stående (4:5)', width: 1080, height: 1350 },
  { id: 'instagram-story-9-16-1080x1920', name: 'Instagram Story (9:16)', width: 1080, height: 1920 },
]

type AspectRatioSelectorProps = {
  value: string
  onChange: (id: string) => void
}

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ color: '#444', fontSize: 14 }}>Target</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 10px',
          borderRadius: 4,
          border: '1px solid #ccc',
          background: 'white',
        }}
      >
        {TARGETS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.width}x{t.height})
          </option>
        ))}
      </select>
    </div>
  )
}

export default AspectRatioSelector


