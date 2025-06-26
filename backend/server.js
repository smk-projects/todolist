require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const todoRoutes = require('./routes/todos');
const googleCalendarService = require('./services/googleCalendar');

const app = express();
const PORT = process.env.PORT || 5000;

// 中介軟體
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 連接 MongoDB
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist')
    .then(() => {
        console.log('✅ 成功連接到 MongoDB');
    })
    .catch((error) => {
        console.error('❌ MongoDB 連接失敗:', error);
        process.exit(1);
    });

// 路由
app.use('/api/todos', todoRoutes);

// 健康檢查端點
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AI Todo List Backend is running',
        timestamp: new Date().toISOString(),
    });
});

// Google Calendar 連線測試端點
app.get('/api/google-calendar/test', async (req, res) => {
    try {
        const result = await googleCalendarService.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `測試失敗: ${error.message}`,
        });
    }
});

// 列出可用的日曆
app.get('/api/google-calendar/calendars', async (req, res) => {
    try {
        const result = await googleCalendarService.listCalendars();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `獲取日曆列表失敗: ${error.message}`,
        });
    }
});

// 建立新日曆
app.post('/api/google-calendar/create-calendar', async (req, res) => {
    try {
        const { name = 'TODO List Calendar' } = req.body;
        const result = await googleCalendarService.createCalendar(name);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `建立日曆失敗: ${error.message}`,
        });
    }
});

// 404 錯誤處理
app.use('*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// 全域錯誤處理
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        error: 'Internal server error',
        message:
            process.env.NODE_ENV === 'development'
                ? error.message
                : 'Something went wrong',
    });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 伺服器正在 http://localhost:${PORT} 上運行`);
    console.log(`📝 API 文檔: http://localhost:${PORT}/api/health`);
    console.log(
        `🗓️  Google Calendar 測試: http://localhost:${PORT}/api/google-calendar/test`
    );
    console.log(
        `📅 可用日曆列表: http://localhost:${PORT}/api/google-calendar/calendars`
    );
    console.log('');

    // 檢查並顯示 Google Calendar 服務狀態
    const serviceStatus = googleCalendarService.getServiceStatus();
    if (serviceStatus.available) {
        console.log('✅ Google Calendar 服務已正確設定');
        console.log(`📅 使用日曆 ID: ${serviceStatus.calendarId}`);
    } else {
        console.warn('⚠️ Google Calendar 服務未完整設定');
        console.warn(`📋 原因: ${serviceStatus.reason}`);
        console.warn(`💡 建議: ${serviceStatus.suggestion}`);
        console.warn(
            '📝 應用程式將只進行本地資料處理，不會同步到 Google Calendar'
        );
    }

    console.log('');
    console.log(
        '💡 如果 Google Calendar 連線失敗，請參考: GOOGLE_CALENDAR_DEBUG.md'
    );
});

module.exports = app;
