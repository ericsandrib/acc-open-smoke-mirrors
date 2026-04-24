import { useTheme } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

const brands = [
  { id: 'stratos' as const, label: 'Stratos', color: '#1E3A8A' },
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
