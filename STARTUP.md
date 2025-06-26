# 🚀 快速啟動指南

## 啟動方式

### 方式一：使用 npm 腳本 (推薦)

```bash
npm run start-all
```

這會使用 `concurrently` 在同一個終端機視窗中平行執行前端和後端，並以不同顏色區分輸出。

### 方式二：使用 Windows 批次檔

雙擊 `start.bat` 檔案，或在命令列執行：

```bash
start.bat
```

這會開啟兩個獨立的命令列視窗，分別執行前端和後端。

### 方式三：手動啟動 (分別執行)

```bash
# 終端機 1 - 啟動後端
npm run backend

# 終端機 2 - 啟動前端
npm run dev
```

## 應用程式網址

- **前端**: http://localhost:3000
- **後端**: http://localhost:5000

## 其他腳本

- `npm run install-all` - 安裝前端和後端的所有依賴
- `npm run build` - 建置前端應用程式
- `npm run lint` - 執行程式碼檢查

## 注意事項

1. 確保 MongoDB 正在運行 (localhost:27017)
2. 在 `backend/.env` 中設定 Google Calendar API 金鑰
3. 第一次執行前請先運行 `npm run install-all`
