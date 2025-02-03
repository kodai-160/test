const express = require('express');
const fs = require('fs-extra');
const Docker = require('dockerode');
const cors = require('cors');
const path = require('path');

const app = express();
const docker = new Docker();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// sandbox用のディレクトリの作成
const WORK_DIR = path.join(__dirname, 'sandbox');
fs.ensureDirSync(WORK_DIR);

app.post('/execute', async (req, res) => {
    let container;

    try {
        const { code } = req.body;
        if (!code) return res.status(400).send("No code provided");

        const filename = `script-${Date.now()}.py`;
        const filepath = path.join(WORK_DIR, filename);

        // 一時ファイルとして保存
        await fs.writeFile(filepath, code);

        // Dockerコンテナを作成
        container = await docker.createContainer({
            Image: "python:3.9-alpine",
            Tty: false,
            Cmd: ["sh", "-c", `timeout 5s python /code/${filename}`],
            HostConfig: {
                Binds: [`${WORK_DIR}:/code`],
                Memory: 128 * 1024 * 1024,
                CpuShares: 512,
                NetworkDisabled: true
            }
        });

        // コンテナを起動
        await container.start();

        // 実行結果を取得
        const logs = await container.logs({ stdout: true, stderr: true, follow: true });

        let output = "";
        let stdoutData = "";
        let stderrData = "";

        logs.on('data', (chunk) => output += chunk.toString().trim());

        logs.on('data', (chunk) => {
           stdoutData += chunk.toString();
           console.log("STDOUT:", chunk.toString()); 
        });

        logs.on('error', (chunk) => {
            stderrData += chunk.toString();
            console.error("STDERR:", chunk.toString());
        })

        await new Promise(resolve => logs.on('end', resolve));

        console.log("Execution Completed.");
        console.log("Final STDOUT:", stdoutData);
        console.log("Final STDERR:", stderrData);

        // コンテナの状態をチェックしてから停止
        const containerInfo = await container.inspect();
        console.log("コンテナの状態:", containerInfo.State);
        if (containerInfo.State.Running) {
            await container.stop();
        }

        await container.remove();
        await fs.unlink(filepath); // 実行後にファイル削除
        res.send(output);

    } catch (error) {
        console.error("エラー:", error);

        // container が存在する場合は削除する
        if (container) {
            try {
                await container.kill();
                await container.remove();
            } catch (cleanupError) {
                console.error("コンテナ削除時のエラー:", cleanupError);
            }
        }

        res.status(500).send(error.toString());
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
