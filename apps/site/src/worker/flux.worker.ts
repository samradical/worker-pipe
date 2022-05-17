import { toWritableStream } from '@rxjs-ninja/rxjs-utility'
import { interval } from 'rxjs'
import { map } from 'rxjs/operators'

const ctx: Worker = self as any

function doSomeWork(value) {
  let sum = value
  for (let i = 0; i < 1e6; i++) {
    sum += Math.random()
    sum -= Math.random()
  }
  return sum
}

function processFromMainThread() {
  return new TransformStream({
    start() {
      console.time('process')
    },
    transform(chunk, controller) {
      controller.enqueue(doSomeWork(chunk))
    },
    flush() {
      console.timeEnd('process')
    },
  })
}

ctx.onmessage = (event) => {
  const [readable, writable] = event.data

  const toMainThread = new TransformStream()

  // transform input and write to output
  readable.pipeThrough(processFromMainThread()).pipeTo(writable)

  interval(1000)
    .pipe(
      map((val) => (val += 1)),
      toWritableStream(toMainThread.writable),
    )
    .subscribe()

  //@ts-expect-error Transferable doesnnt include streams
  self.postMessage([toMainThread.readable], [toMainThread.readable])
}
