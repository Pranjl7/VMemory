// Best Fit: choose the smallest hole that can still hold the request (least leftover space).
export function bestFit(holes, size) {
  let hole = null
  for (const h of holes) {
    if (h.size >= size && (!hole || h.size < hole.size)) hole = h
  }
  return {
    hole,
    reason: hole
      ? `Best Fit compared all ${holes.length} holes and picked the smallest that fits: ${hole.size} MB at ${hole.start} MB (leaves ${hole.size - size} MB).`
      : null,
  }
}
