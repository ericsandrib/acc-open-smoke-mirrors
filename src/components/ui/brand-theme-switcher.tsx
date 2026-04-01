import { useTheme } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

const brands = [
  { id: 'mercer' as const, label: 'Mercer', color: '#c00686' },
  { id: 'guardian' as const, label: 'Guardian', color: '#e85526' },
  { id: 'vanguard' as const, label: 'Vanguard', color: '#c20029' },
]

export function BrandThemeSwitcher() {
  const { brandTheme, setBrandTheme } = useTheme()

  return (
    <div className="flex items-center gap-1">
      {brands.map((brand) => (
        <button
          key={brand.id}
          onClick={() => setBrandTheme(brand.id)}
          title={brand.label}
          className={cn(
            'h-5 w-5 rounded-full border-2 transition-all',
            brandTheme === brand.id
              ? 'border-foreground scale-110'
              : 'border-transparent opacity-60 hover:opacity-100',
          )}
          style={{ backgroundColor: brand.color }}
        />
      ))}
    </div>
  )
}
