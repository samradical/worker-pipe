const ctx: SharedWorker = self as any

ctx.onconnect = function (e) {
  const leaderFolloweChannel = new MessageChannel()
  var mainthreadPort = e.ports[0]
  console.log('follower connected')

  mainthreadPort.onmessage = function (e) {
    const { port, id } = e.data

    // port.onmessage = function (workerE) {
    //   const encoder = new TextDecoder()
    //   const view = encoder.decode(workerE.data)
    //   mainthreadPort.postMessage([`leader told me: ${view}`])
    // }

    leaderFolloweChannel.port2.onmessage = function (leaderEvt) {
      const encoder = new TextDecoder()
      const view = encoder.decode(leaderEvt.data)
      mainthreadPort.postMessage([`leader told me: ${view}`])
    }

    port.postMessage({ id, port: leaderFolloweChannel.port1 }, [
      leaderFolloweChannel.port1,
    ])
  }
}
