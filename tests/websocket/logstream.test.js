const http = require("http")
const WebSocket = require("ws")

const {
  initWebSocket,
  broadcastLog
} = require("../../wraply-api/websocket")

describe("Log Streaming", () => {

  let server

  beforeAll(done => {

    server = http.createServer()

    initWebSocket(server)

    server.listen(4010, done)

  })

  afterAll(done => {

    server.close(done)

  })

  test("receive log stream", done => {

    const ws = new WebSocket("ws://localhost:4010?jobId=test_job")

    ws.on("open", () => {

      broadcastLog("test_job", "hello log")

    })

    ws.on("message", msg => {

      const data = JSON.parse(msg)

      if (data.type === "log") {

        expect(data.data).toBe("hello log")

        ws.close()

        done()

      }

    })

  })

})