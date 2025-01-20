const Docker = require('dockerode');
const fs = require('fs/promises');

(async () => {
    try{
        // Dockerデーモンに接続
        const docker = new Docker();

        const conImage = "python:3.9-alpine";

        // コンテナを起動
        const container = await docker.createContainer({
            Image: conImage,
            Tty: true,
            Cmd: ['/bin/sh']
        });
        await container.start();

        const code = await fs.readFile('test2.py', 'utf-8');

        // コンテナ内でPythonコードを実行
        const exec = await container.exec({
            Cmd: ["sh", "-c", `cat <<EOF | python\n${code}\nEOF`],
            AttachStdout: true,
            AttachStderr: true, 
        });

        const stream = await exec.start();

        // 出力を収集
        let output = "";
        stream.on('data', (chunk) => {
            output += chunk.toString();
        });

        // ストリームの終了を待つ
        await new Promise((resolve) => stream.on('end', resolve));

        console.log("Execution Output:", output);

        // コンテナを停止し削除
        await container.stop();
        await container.remove();
    } catch (err) {
        console.error(err);
    }
})();