// I ported this from Java. Please don't ask me how it works.
function* piDigits() {
  let k = 1n
  let l = 3n
  let n = 3n
  let q = 1n
  let r = 0n
  let t = 1n
  let nn
  let nr

  while (true) {
    if (4n * q + r - t < n * t) {
      yield n
      nr = 10n * (r - n * t)
      n = (10n * (3n * q + r)) / t - 10n * n
      q *= 10n
      r = nr
    } else {
      nr = (2n * q + r) * l
      nn = (q * (7n * k) + 2n + r * l) / (t * l)
      q *= k
      t *= l
      l += 2n
      k += 1n
      n = nn
      r = nr
    }
  }
}

function* chunkOfPi(chunkLength) {
  let chunk = ''
  for (const digit of piDigits()) {
    chunk += digit
    if (chunk.length === chunkLength) {
      yield chunk
      chunk = ''
    }
  }
}

export function piStream(chunkLength) {
  const piChunkIterator = chunkOfPi(chunkLength)
  return new ReadableStream({
    pull(controller) {
      controller.enqueue(piChunkIterator.next().value)
    },
  })
}
