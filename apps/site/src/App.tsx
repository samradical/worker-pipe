import { createRef, useEffect, useRef, useState } from 'react'
import logo from './logo.svg'
import './App.css'

import FluxWorker from './worker/flux.worker?worker'
import LeaderWorker from './worker/leader?sharedworker'
import FollowerWorker from './worker/follower?sharedworker'
import { fromEvent, merge, Subject } from 'rxjs'
import { takeUntil, switchMap, tap, bufferTime } from 'rxjs/operators'

type Command = string

function arrayToStream() {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  return { readable, writer }
}

function printToElementStream(message = '') {
  return new WritableStream({
    write(chunk: string) {
      console.log(message + chunk)
    },
    close() {
      console.log('closed')
    },
  })
}
function forwardWorkerPayload(output$: Subject<any>) {
  return new WritableStream({
    write(chunk: string) {
      const d = JSON.parse(chunk)
      const status = `payload is  ~${(chunk.length * 1e-6).toFixed(
        6,
      )}Mb (${d.timeToGenerate.toFixed(4)}ms to gen). Took ${(
        performance.now() - d.timestamp
      ).toFixed(4)}ms to receive & parse`
      output$.next({
        d,
        status,
      })
    },
    close() {
      console.log('closed')
    },
  })
}

export const setupRxWorkerFlux = (Worker: new () => Worker) => {
  const worker = new Worker()
  const output$ = new Subject<any>()

  worker.addEventListener('message', (event) => {
    const [fromWorker] = event.data
    fromWorker.pipeTo(forwardWorkerPayload(output$))
  })

  const { readable, writer } = arrayToStream()
  const writable = printToElementStream(
    'Originated from main thread and was sent back: ',
  )

  //@ts-expect-error Transferable doesnnt include streams
  worker.postMessage([readable, writable], [readable, writable])

  return {
    write(val: Command) {
      writer.write(val)
    },
    output$,
  }
}

export const setupSharedWorkersFlux = () => {
  const f1Channel = new MessageChannel()
  const f2Channel = new MessageChannel()
  const leader = new LeaderWorker()
  const follower1 = new FollowerWorker()
  const follower2 = new FollowerWorker()
  follower1.port.postMessage({ id: 'ONE', port: f1Channel.port1 }, [
    f1Channel.port1,
  ])
  follower2.port.postMessage({ id: 'TWO', port: f2Channel.port1 }, [
    f2Channel.port1,
  ])

  leader.port.postMessage(
    {
      id: 'LEADER',
      initFollower1Port: f1Channel.port2,
      initFollower2Port: f2Channel.port2,
    },
    [f1Channel.port2, f2Channel.port2],
  )
  follower1.port.onmessage = function (e) {
    console.log(e.data)
    // console.log(
    //   `follower ONE: Got from follower: ${e.data[0].length} `,
    // )
  }
  follower2.port.onmessage = function (e) {
    // console.log(
    //   `follower TWO: Got from follower: ${e.data[0].length} `,
    // )
  }
}

function App() {
  const [writeToWorker, setSub1] = useState('play')
  const [status, setStatus] = useState('')
  const [intensity, setIntense] = useState(1)
  const [tail, setTail] = useState(true)
  const ref = useRef<HTMLImageElement | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const rxWorkerFlux = useRef<ReturnType<typeof setupRxWorkerFlux>>()
  // const followerWorkerFlux =
  //   useRef<ReturnType<typeof setupSharedWorkerFlux>>()
  // const leaderWorkerFlux =
  //   useRef<ReturnType<typeof setupSharedWorkerFlux>>()

  useEffect(() => {
    rxWorkerFlux.current = setupRxWorkerFlux(FluxWorker)
    setupSharedWorkersFlux()
  }, [])

  useEffect(() => {
    rxWorkerFlux.current?.write(writeToWorker)
    let c = 0
    const sub = rxWorkerFlux.current?.output$
      .pipe(bufferTime(1000))
      .subscribe((d) => {
        const status = d.reduce((acc, v) => acc + '\n' + v.status, '')
        c += d.length
        if (c >= 10_000) {
          setStatus(status)
          c = 0
        } else {
          setStatus((s) => s + '\n' + status)
        }
        c++
      })
    return () => sub?.unsubscribe()
  }, [writeToWorker])

  useEffect(() => {
    // leaderWorkerFlux.current?.write(`intensity_${intensity}`)
    rxWorkerFlux.current?.write(`intensity_${intensity}`)
  }, [intensity])

  useEffect(() => {
    let i = setInterval(function () {
      if (textRef.current && tail) {
        textRef.current.scrollTop = textRef.current.scrollHeight
      }
    }, 200)
    return () => clearInterval(i)
  }, [tail])

  useEffect(() => {
    if (!ref.current) return

    const el = ref.current
    fromEvent(el, 'mousedown')
      .pipe(
        switchMap(() =>
          fromEvent<MouseEvent>(el, 'mousemove').pipe(
            tap((e) => {
              el.style.left = e.clientX - 150 + 'px'
              el.style.top = e.clientY - 150 + 'px'
            }),
            takeUntil(
              merge(
                fromEvent(el, 'mouseup'),
                fromEvent(el, 'mouseleave'),
              ),
            ),
          ),
        ),
      )
      .subscribe()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <div ref={ref} className="drag">
          drag me
        </div>
        <button onClick={() => setSub1((s) => 'pause')}>pause</button>
        <button onClick={() => setSub1((s) => 'play')}>play</button>
        <div>intensity: {intensity}</div>
        <button onClick={() => setIntense((s) => Math.min(s + 1, 8))}>
          + data
        </button>
        <button onClick={() => setIntense((s) => Math.max(s - 1, 1))}>
          - data
        </button>
        <span>tail?</span>
        <input
          type="checkbox"
          onChange={(e) => {
            setTail(e.currentTarget.checked)
          }}
          checked={tail}
        />
        <textarea
          ref={textRef}
          id="story"
          name="story"
          rows={50}
          cols={120}
          defaultValue="It was a dark and stormy night..."
          value={status}
        ></textarea>
      </header>
    </div>
  )
}

export default App
