// First Fit: scan holes from the lowest address and take the first one that is big enough.
export function firstFit(holes, size) {
  const hole = holes.find((h) => h.size >= size) || null
  return {
    hole,
    reason: hole
      ? `First Fit scanned from address 0 and picked the first hole that fits: ${hole.size} MB at ${hole.start} MB.`
      : null,
  }
}
