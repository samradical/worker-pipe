import { Subject, tap } from 'rxjs'
import { v4 } from 'uuid'
import { setupFlux } from './flux'
import { setupRegistry } from './registry'
import { AllOutput, AssetId2, FluxKey, IQuery, UUId } from './types'
import Worker from './worker/flux.worker?worker'
import { createObservableWebWorker } from './worker/utils/worker-utils'

export const setupRxWorkerFlux = () => {
  const worker = new Worker()

  const toWorker = new WritableStream({
    write: (data) => {},
    abort: (e) => {},
    close: () => {},
  })

  const fromWorker = new ReadableStream({
    async pull(controller) {
      //   const { value, done } = await iterator.next();
      //   if (done) {
      //     controller.close();
      //   } else {
      //     controller.enqueue(value);
      //   }
    },
  })

  worker.addEventListener('message', (event) => {
    console.log(event)
  })

  //   worker.onmessage = (event) => {
  //     console.log(event)
  //     const [toWorker, fromWorker] = event.data
  //     console.log(toWorker, fromWorker)
  //   }
  //@ts-expect-error Transferable doesnnt include streams
  worker.postMessage([toWorker], [toWorker])
}
