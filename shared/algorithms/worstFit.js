// Worst Fit: choose the largest hole, leaving the biggest possible leftover for future requests.
export function worstFit(holes, size) {
  let hole = null
  for (const h of holes) {
    if (h.size >= size && (!hole || h.size > hole.size)) hole = h
  }
  return {
    hole,
    reason: hole
      ? `Worst Fit compared all ${holes.length} holes and picked the largest: ${hole.size} MB at ${hole.start} MB (leaves ${hole.size - size} MB).`
      : null,
  }
}
