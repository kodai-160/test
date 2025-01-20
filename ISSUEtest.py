import requests

def create_issue(token, repo, title, body):
    url = f"https://api.github.com/repos/{repo}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "title": title,
        "body": body
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print("イシューが正常に作成されました。")
        return response.json()
    else:
        print("イシューの作成に失敗しました。")
        return response.json()

# 使用例
token = 'YOUR_GITHUB_TOKEN'
repository = 'username/repository'
issue_title = 'Example Issue'
issue_body = 'This is an example issue created via the GitHub API.'
create_issue(token, repository, issue_title, issue_body)
