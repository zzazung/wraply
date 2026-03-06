// api/server.js
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
require('dotenv').config();

const { initWebSocket } = require("./websocket");

const authRoutes = require("./routes/auth");
const jobsRouter = require("./routes/jobs");
const internalRouter = require("./routes/internal");
const androidSigningRouter = require("./routes/signing.android");
const userProjectsRouter = require("./routes/user.projects");
const artifactRoutes = require("./routes/artifacts");
const installRoutes = require("./routes/install");

// const CI_ROOT = process.env.CI_ROOT || process.cwd();
const CI_ROOT = process.env.CI_ROOT || "/ci";

const app = express();

// CORS는 반드시 라우터보다 위에 있어야 한다.
const corsOptions = {
    origin: function (origin, callback) {
        const allowed = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://192.168.0.177:3000',
            'http://192.168.0.177:3001',
        ];

        if (!origin || allowed.includes(origin)) {
            callback(null, origin); // 정확한 origin 반환
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));

// ✅ builds 정적 서빙 (항상 CI_ROOT 기준)
app.use("/downloads",
    express.static(path.join(CI_ROOT, "builds"), {
        fallthrough: false, // 파일이 없으면 404 반환
        index: false, // 디렉토리 인덱스 비활성화
    })
);

// routes
app.use("/auth", authRoutes);
app.use("/jobs", jobsRouter);
app.use("/internal", internalRouter);
app.use("/android/signing", androidSigningRouter);
app.use("/user", userProjectsRouter);
app.use("/artifacts", artifactRoutes);
app.use("/install", installRoutes);

// app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);

// ✅ websocket 연결
initWebSocket(server);

const PORT = Number(process.env.API_PORT || 4000);

server.listen(PORT, () => {
  console.log(`✅ Wraply API running on ${PORT}`);
//   console.log(`📦 downloads: ${path.join(CI_ROOT, "builds")}`);
});