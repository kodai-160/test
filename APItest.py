import requests

def create_repository(token, name, description):
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "name": name,
        "description": description,
        "private": True,
        "auto_init": True,
        "gitignore_template": "Python"
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print("リポジトリが正常に作成されました。")
        return response.json()
    else:
        print("リポジトリの作成に失敗しました。")
        return response.json()

token = 'tour_token'
repo_name = 'test'
description = 'This is a test created by GitHub REST API.'
create_repository(token, repo_name, description)
