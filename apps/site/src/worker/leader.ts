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
      followerPorts.forEach((p) => {
        const encoder = new TextEncoder()
        const view = encoder.encode('random text')
        p.postMessage(view, [view.buffer])
      })
    }, 1000)
  }
}
