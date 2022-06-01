//@ts-expect-error
self.onconnect = function (e) {
  const leaderFolloweChannel = new MessageChannel()
  var mainthreadPort = e.ports[0]
  console.log('follower connected')

  mainthreadPort.onmessage = function (e) {
    const { port, id } = e.data

    leaderFolloweChannel.port2.onmessage = function (leaderEvt) {
      const encoder = new TextDecoder()
      // our array buffer from flux
      const view = encoder.decode(leaderEvt.data)

      // ?? forward array buffer?
      // mainthreadPort.postMessage(leaderEvt.data, [
      //   leaderEvt.data.buffer,
      // ])

      mainthreadPort.postMessage(view)
    }

    port.postMessage({ id, port: leaderFolloweChannel.port1 }, [
      leaderFolloweChannel.port1,
    ])
  }
}
