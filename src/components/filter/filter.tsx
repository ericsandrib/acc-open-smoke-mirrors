import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FilterTrigger } from './filter-trigger'
import { FilterInputRow } from './filter-input-row'
import { FilterPanel } from './filter-panel'
import { MORPH_SPRING, type FilterProps } from './filter-types'

export function Filter(props: FilterProps) {
  const {
    label,
    state = 'default',
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    onRemove,
    className,
  } = props

  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const expanded = expandedProp !== undefined ? expandedProp : internalExpanded
  const setExpanded = (val: boolean) => {
    setInternalExpanded(val)
    onExpandedChange?.(val)
  }

  const [search, setSearch] = useState('')

  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  const measure = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [])

  useEffect(() => {
    measure()
  }, [props, measure])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const hasMounted = useRef(false)
  useEffect(() => {
    requestAnimationFrame(() => {
      hasMounted.current = true
    })
  }, [])

  const isDisabled = state === 'disabled'
  const targetHeight = expanded ? contentHeight : 0
  const hasOptions = props.type !== 'free-text'

  return (
    <div
      className={cn(
        'group/filter rounded-md border border-border overflow-clip transition-colors',
        expanded ? 'bg-accent' : 'bg-background hover:bg-accent',
        isDisabled && 'opacity-70',
        className,
      )}
    >
      <FilterTrigger
        label={label}
        expanded={expanded}
        state={state}
        onToggle={() => setExpanded(!expanded)}
        onRemove={onRemove}
      />

      <FilterInputRow
        filterProps={props}
        expanded={expanded}
        search={search}
        onSearchChange={setSearch}
      />

      {hasOptions && (
        <motion.div
          initial={false}
          animate={{
            height: hasMounted.current ? targetHeight : expanded ? 'auto' : 0,
          }}
          transition={MORPH_SPRING}
          style={{ overflow: 'hidden' }}
        >
          <motion.div
            ref={contentRef}
            initial={false}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={{
              duration: 0.15,
              delay: expanded ? 0.08 : 0,
            }}
          >
            <FilterPanel filterProps={props} search={search} />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
