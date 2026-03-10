const { closeWebSocket } = require("../../wraply-api/websocket");

/*
 * globalSetup에서는 jest가 존재하지 않음
 */
if (typeof jest !== "undefined") {
  jest.setTimeout(30000);
}

/**
 * BullMQ worker error noise 제거
 */
process.on("unhandledRejection", err => {
  console.error("UnhandledRejection:", err);
});

afterAll(async () => {
  jest.clearAllMocks();

  try {
    await closeWebSocket();
  } catch {}

  // 테스트 종료 시 open handle 방지
  await new Promise(resolve => setTimeout(resolve, 100));
});