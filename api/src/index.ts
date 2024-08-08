import 'dotenv/config'
import './lib/persistence'
import { app, finalize, server } from './lib/server'
import './meshtastic'
import { connect, disconnect, deleteNodes, requestPosition, send, traceRoute } from './meshtastic'
import { address, apiPort, currentTime, apiHostname, accessKey, autoConnectOnStartup } from './vars'
import { hostname } from 'os'
import intercept from 'intercept-stdout'
setInterval(() => currentTime.set(Date.now()), 15000)

let consoleLog = []
let logSize = 1000

intercept(
  (text) => {
    if (text.includes('Possible EventTarget memory leak detected')) return
    consoleLog.push(text)
    while (consoleLog.length >= logSize) consoleLog.shift()
  },
  (err) => {
    consoleLog.push(err)
    while (consoleLog.length >= logSize) consoleLog.shift()
  }
)

app.post('/send', (req, res) => {
  let message = req.body.message
  let destination = req.body.destination
  let channel = req.body.channel
  send({ message, destination, channel })
  return res.sendStatus(200)
})

app.post('/traceRoute', async (req, res) => {
  let destination = req.body.destination
  await traceRoute(destination)
  return res.sendStatus(200)
})

app.post('/requestPosition', async (req, res) => {
  let destination = req.body.destination
  await requestPosition(destination)
  return res.sendStatus(200)
})

app.post('/deleteNodes', async (req, res) => {
  let nodes = req.body.nodes
  await deleteNodes(nodes)
})

app.post('/connect', async (req, res) => {
  console.log('[express]', '/connect')
  connect(req.body.address || address.value)
  return res.sendStatus(200)
})

app.post('/disconnect', async (req, res) => {
  console.log('[express]', '/disconnect')
  disconnect()
  return res.sendStatus(200)
})

app.get('/consoleLog', async (req, res) => {
  if (req.query.accessKey != accessKey.value && req.hostname.toLowerCase() != 'localhost') return res.sendStatus(403)
  return res.json(consoleLog)
})

finalize()

apiHostname.set(hostname())
apiPort.set((server.address() as any)?.port)

if (autoConnectOnStartup.value && address.value) connect(address.value)
