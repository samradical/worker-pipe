import { useEffect, useRef, useState } from 'react'
import logo from './logo.svg'
import './App.css'

import Worker from './worker/flux.worker?worker'

function arrayToStream() {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  return { readable, writer }
}

function printToElementStream(message = '') {
  return new WritableStream({
    write(chunk) {
      console.log(message + chunk)
    },
    close() {
      console.log('closed')
    },
  })
}

export const setupRxWorkerFlux = () => {
  const worker = new Worker()

  worker.addEventListener('message', (event) => {
    const [fromWorker] = event.data
    fromWorker.pipeTo(
      printToElementStream('Originated from worker: '),
    )
  })

  const { readable, writer } = arrayToStream()
  const writable = printToElementStream(
    'Originated from main thread and was sent back: ',
  )

  //@ts-expect-error Transferable doesnnt include streams
  worker.postMessage([readable, writable], [readable, writable])

  return {
    write(val: number) {
      writer.write(val)
    },
  }
}

function App() {
  const [writeToWorker, setSub1] = useState(0)
  const rxWorkerFlux = useRef<ReturnType<typeof setupRxWorkerFlux>>()
  useEffect(() => {
    rxWorkerFlux.current = setupRxWorkerFlux()
  }, [])

  useEffect(() => {
    rxWorkerFlux.current?.write(writeToWorker)
  }, [writeToWorker])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <button onClick={() => setSub1((s) => Math.random())}>
          write command to worker
        </button>
      </header>
    </div>
  )
}

export default App
