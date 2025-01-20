import docker
## dockerデーモンに接続
cli = docker.from_env()

cont_image = "python:3.9-alpine"
cont_run = cli.containers.run(image=cont_image, detach=True, tty=True, command=["/bin/sh"])

with open("./test2.py", encoding="utf-8") as f:
    code = f.read()
    
exec_run = cont_run.exec_run(["sh", "-c", f"cat<<EOF | python\n{code}\nEOF"]).output.decode("utf-8")