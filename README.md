# Todo List Management

待辦事項管理應用程式，可整合 GOOGLE CALENDAR 進行待辦事項的提醒。

## 系統截圖

![](README/20250626183729.png)

## 功能特色

- ✅ 新增、編輯、刪除待辦事項
- 📅 自動同步到 Google Calendar
- 📱 響應式設計，支援手機和桌面
- 🎨 使用 Bootstrap 5 美化界面
- 🔔 支援提醒時間設定
- 📍 支援地點資訊

## 技術架構

### 前端

- **React 18** - 使用者介面框架
- **Next.js 14** - React 框架，支援 SSR
- **TypeScript** - 型別安全
- **Redux Toolkit** - 狀態管理
- **Bootstrap 5** - CSS 框架
- **SCSS** - CSS 預處理器
- **FontAwesome** - 圖示庫

### 後端

- **Node.js** - 執行環境
- **Express.js** - Web 框架
- **MongoDB** - 資料庫
- **Mongoose** - MongoDB ODM
- **Google APIs** - Google Calendar 整合
- **dotenv** - 環境變數管理

## 安裝與設定

### 前置需求

- Node.js (v18 或以上)
- MongoDB
- Google Cloud Platform 帳號 (用於 Calendar API)

### 1. 克隆專案

\`\`\`bash
git clone <repository-url>
cd todolist
\`\`\`

### 2. 安裝前端依賴

\`\`\`bash
npm install
\`\`\`

### 3. 安裝後端依賴

\`\`\`bash
cd backend
npm install
\`\`\`

### 4. 設定環境變數

在 \`backend\` 目錄下建立 \`.env\` 檔案：
\`\`\`env

# MongoDB 連線資訊

MONGODB_URI=mongodb://localhost:27017/todolist
MONGODB_DB_NAME=todolist

# Google Calendar API 設定

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here

# 伺服器設定

PORT=5000
NODE_ENV=development

# CORS 設定

FRONTEND_URL=http://localhost:3000
\`\`\`

### 5. Google Calendar API 設定

本應用程式使用 **Google Service Account** 方式整合 Google Calendar，無需 OAuth 授權流程。

#### 快速設定步驟：

1. **建立 Google Cloud Platform 專案**
    - 前往 [Google Cloud Console](https://console.cloud.google.com/)
    - 建立新專案或選擇現有專案

2. **啟用 Google Calendar API**
    - 在 GCP Console 中啟用 Google Calendar API

3. **建立 Service Account**
    - 前往「API 和服務」>「憑證」
    - 建立服務帳戶並下載 JSON 金鑰檔案

4. **設定環境變數**
    - 從 JSON 檔案中提取資訊填入 `backend/.env`：

    ```env
    GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
    GOOGLE_PROJECT_ID=your-google-project-id
    GOOGLE_CALENDAR_ID=primary
    ```

5. **設定日曆權限**
    - 在 Google Calendar 中將服務帳戶電子郵件加入日曆共用權限

📖 **詳細設定說明**: 請參閱 [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md)

## 執行應用程式

### 開發模式

1. 啟動後端伺服器：
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

2. 啟動前端應用：
   \`\`\`bash
   npm run dev
   \`\`\`

3. 開啟瀏覽器訪問 \`http://localhost:3000\`

### 生產模式

1. 建置前端：
   \`\`\`bash
   npm run build
   \`\`\`

2. 啟動應用：
   \`\`\`bash
   npm start
   cd backend && npm start
   \`\`\`

## API 端點

### 工作項目管理

- \`GET /api/todos\` - 取得所有工作項目
- \`POST /api/todos\` - 新增工作項目
- \`GET /api/todos/:id\` - 取得特定工作項目
- \`PUT /api/todos/:id\` - 更新工作項目
- \`DELETE /api/todos/:id\` - 刪除工作項目

### 系統狀態

- \`GET /api/health\` - 健康檢查

## 專案結構

\`\`\`
todolist/
├── src/ # 前端原始碼
│ ├── app/ # Next.js App Router
│ ├── components/ # React 組件
│ ├── store/ # Redux store
│ ├── types/ # TypeScript 型別定義
│ └── assets/ # 靜態資源
├── backend/ # 後端原始碼
│ ├── models/ # MongoDB 模型
│ ├── routes/ # API 路由
│ ├── services/ # 業務邏輯服務
│ └── server.js # 主要伺服器檔案
├── package.json # 前端依賴
└── README.md
\`\`\`

## 使用說明

1. **新增待辦事項**：點擊右上角的「Add ToDo」按鈕
2. **編輯待辦事項**：點擊卡片右上角的編輯圖示
3. **刪除待辦事項**：點擊卡片右上角的刪除圖示
4. **查看詳情**：待辦事項會以卡片形式顯示所有資訊

## 貢獻指南

1. Fork 此專案
2. 建立功能分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交變更 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 開啟 Pull Request

## 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案
