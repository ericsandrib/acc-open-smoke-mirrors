export function compareString<T>(accessor: (item: T) => string) {
  return (a: T, b: T) => accessor(a).localeCompare(accessor(b))
}

export function compareStatus<T>(
  accessor: (item: T) => string,
  orderMap: Record<string, number>,
) {
  return (a: T, b: T) => (orderMap[accessor(a)] ?? 99) - (orderMap[accessor(b)] ?? 99)
}

export function compareFraction<T>(
  numAccessor: (item: T) => number,
  denomAccessor: (item: T) => number,
) {
  return (a: T, b: T) => {
    const ratioA = denomAccessor(a) === 0 ? 0 : numAccessor(a) / denomAccessor(a)
    const ratioB = denomAccessor(b) === 0 ? 0 : numAccessor(b) / denomAccessor(b)
    return ratioA - ratioB || denomAccessor(a) - denomAccessor(b)
  }
}

export const journeyStatusOrder: Record<string, number> = {
  not_started: 0,
  in_progress: 1,
  complete: 2,
  cancelled: 3,
}

export const taskStatusOrder: Record<string, number> = {
  not_started: 0,
  in_progress: 1,
  complete: 2,
  blocked: 3,
}
