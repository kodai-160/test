const express = require('express');
const fs = require('fs-extra');
const Docker = require('dockerode');
const cors = require('cors');
const path = require('path');
const { performance } = require('perf_hooks');

const app = express();
const docker = new Docker();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const WORK_DIR = path.join(__dirname, 'sandbox');
fs.ensureDirSync(WORK_DIR);

// コード実行API
app.post('/execute', async (req, res) => {
    let container;
    let startTime, endTime;

    try {
        const { code } = req.body;
        if (!code) return res.status(400).send("No code provided");

        const filename = `script-${Date.now()}.py`;
        const scriptPath = path.join(WORK_DIR, filename);

        await fs.writeFile(scriptPath, code);

        container = await docker.createContainer({
            Image: "python:3.9-alpine", // 修正
            Tty: false,
            Cmd: ["sh", "-c", `timeout 5s python /code/${filename}`],
            HostConfig: {
                Binds: [`${WORK_DIR}:/code`],
                Memory: 128 * 1024 * 1024,
                CpuShares: 512,
                NetworkDisabled: true
            }
        });

        startTime = performance.now();
        await container.start();

        const logStream = await container.logs({ stdout: true, stderr: true, follow: true });

        let stdoutData = "";
        let stderrData = "";

        logStream.on('data', (chunk) => {
            const cleaned = cleanDockerLogs(chunk);
            stdoutData += cleaned;
        });

        logStream.on('error', (chunk) => {
            const cleaned = cleanDockerLogs(chunk);
            stderrData += cleaned;
        });

        await new Promise(resolve => logStream.on('end', resolve)); // 修正

        endTime = performance.now();

        await container.remove();
        await fs.unlink(scriptPath);

        res.json({
            stdout: stdoutData.trim(),
            stderr: stderrData.trim(),
            executionTime: (endTime - startTime) / 1000
        });

    } catch (error) {
        console.error("エラー:", error);

        if (container) {
            try {
                await container.kill();
                await container.remove();
            } catch (cleanupError) {
                console.error("コンテナ削除時のエラー:", cleanupError);
            }
        }

        res.status(500).json({ error: error.toString() });
    }
});

// コード評価API
app.post('/evaluate', async (req, res) => {
    let container;
    let startTime, endTime;

    try {
        const { code } = req.body;
        if (!code) return res.status(400).send("No code provided");

        const filename = `script-${Date.now()}.py`;
        const scriptPath = path.join(WORK_DIR, filename);

        await fs.writeFile(scriptPath, code);

        container = await docker.createContainer({
            Image: "python:3.9-alpine", // 修正
            Tty: false,
            Cmd: ["sh", "-c", `python /code/evaluator/eval_script.py /code/${filename}`],
            HostConfig: {
                Binds: [`${WORK_DIR}:/code`],
                Memory: 128 * 1024 * 1024,
                CpuShares: 512,
                NetworkDisabled: true
            }
        });

        startTime = performance.now();
        await container.start();

        const logStream = await container.logs({ stdout: true, stderr: true, follow: true });

        let evalOutput = "";
        let evalError = "";

        logStream.on('data', (chunk) => evalOutput += chunk.toString());
        logStream.on('error', (chunk) => evalError += chunk.toString());

        await new Promise(resolve => logStream.on('end', resolve));

        endTime = performance.now();

        await container.remove();
        await fs.unlink(scriptPath);

        res.json({
            output: evalOutput.trim(),
            error: evalError.trim(),
            evaluationTime: (endTime - startTime) / 1000
        });

    } catch (error) {
        console.error("評価エラー", error);

        if (container) {
            try {
                await container.kill();
                await container.remove();
            } catch (cleanupError) {
                console.error("コンテナ削除時のエラー:", cleanupError);
            }
        }

        res.status(500).json({ error: error.toString() });
    }
});

// 出力の調整
function cleanDockerLogs(buffer) {
    const HEADER_SIZE = 8;
    let result = "";

    let offset = 0;
    while (offset + HEADER_SIZE <= buffer.length) {
        const header = buffer.slice(offset, offset + HEADER_SIZE);
        const payloadSize = header.readUInt32BE(4);
        const payload = buffer.slice(offset + HEADER_SIZE, offset + HEADER_SIZE + payloadSize);
        result += payload.toString();
        offset += HEADER_SIZE + payloadSize;
    }
    return result;
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
