import { generateJson } from 'json-generator'
import { doSomeSmallWork } from './json-gen'

//@ts-expect-error
self.onconnect = function (e) {
  console.log('leader connected')
  var mainThreadPort = e.ports[0]
  console.log(e)

  let followerPorts: MessagePort[] = []

  mainThreadPort.onmessage = function (e) {
    //first message comes in for the handshake channel
    for (const key in e.data) {
      if (key.includes('init')) {
        const initPort = e.data[key]
        // init message from follower with communication port
        initPort.onmessage = function (evt) {
          const { id } = evt.data
          console.log(`got port from ${id}`)
          followerPorts.push(evt.data.port)
        }
      }
    }

    setInterval(function () {
      const encoder = new TextEncoder()
      const view = encoder.encode(JSON.stringify(doSomeSmallWork(4)))
      const followerViews = followerPorts.map(
        (f) => new Uint8Array(view.byteLength),
      )
      const s = performance.now()
      for (let i = 0; i < view.byteLength; i++) {
        const element = view[i]
        followerViews.forEach((newView) => {
          newView[i] = element
        })
      }
      console.log('took', performance.now() - s)
      followerPorts.forEach((fp, i) => {
        fp.postMessage(followerViews[i], [followerViews[i].buffer])
      })
    }, 100)
  }
}
