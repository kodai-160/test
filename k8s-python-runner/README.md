k8s-python-runner/
│── server/              # Node.js サーバー (Kubernetes Jobを作成・管理)
│   ├── index.js         # Expressサーバー (API)
│   ├── package.json     # Node.js 依存関係
│   ├── Dockerfile       # サーバーのDockerfile
│   └── .dockerignore    # Dockerビルド時の無視ファイル
│
│── worker/              # 実際にPythonコードを実行するコンテナ
│   ├── evaluator/       # (オプション) 評価スクリプト
│   │   ├── eval_script.py # Python評価ロジック
│   ├── Dockerfile       # WorkerのDockerfile
│
│── k8s/                 # Kubernetes の設定ファイル
│   ├── job.yaml         # Job テンプレート
│   ├── deployment.yaml  # Node.js サーバーのデプロイ
│   ├── service.yaml     # Node.js サーバーのサービス
│
└── README.md            # 手順メモ
