# 📁 憑證檔案設定說明

## 📋 設定步驟

### 1. 取得 Google Service Account JSON 檔案

請依照 `GOOGLE_CALENDAR_SETUP.md` 的說明，從 Google Cloud Platform 下載 Service Account JSON 檔案。

### 2. 放置憑證檔案

將下載的 JSON 檔案重新命名為 `google-service-account.json`，並放置在此資料夾中：

```
backend/credentials/google-service-account.json
```

### 3. 檔案格式範例

您可以參考 `google-service-account.json.example` 檔案了解正確的格式。

## 🔒 安全注意事項

1. **憑證檔案保護**:
    - 此資料夾中的 `*.json` 檔案已被 `.gitignore` 排除
    - 請勿將實際憑證檔案提交到版本控制系統

2. **檔案權限**:
    - 確保憑證檔案只有必要的讀取權限
    - 在生產環境中考慮使用更安全的憑證管理方式

## ✅ 驗證設定

設定完成後，啟動後端伺服器應該會看到類似訊息：

```
✅ Google Calendar Service 初始化成功
📧 服務帳戶: your-service-account@your-project.iam.gserviceaccount.com
📅 目標日曆: primary
```

如果看到錯誤訊息，請檢查：

- JSON 檔案是否存在於正確位置
- JSON 檔案格式是否正確
- 環境變數 `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` 是否設定正確
