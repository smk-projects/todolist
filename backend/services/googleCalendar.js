const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleCalendarService {
    constructor() {
        try {
            // 讀取 Google Service Account JSON 檔案
            const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

            if (!keyFilePath) {
                console.warn(
                    '⚠️ 未設定 GOOGLE_SERVICE_ACCOUNT_KEY_FILE，Google Calendar 功能將被停用'
                );
                this.calendar = null;
                return;
            }

            // 轉換為絕對路徑
            const absoluteKeyPath = path.resolve(__dirname, '..', keyFilePath);

            // 檢查檔案是否存在
            if (!fs.existsSync(absoluteKeyPath)) {
                console.warn(
                    `⚠️ Google Service Account JSON 檔案不存在: ${absoluteKeyPath}`
                );
                console.warn(
                    '💡 請將 Google Service Account JSON 檔案放置在指定位置'
                );
                this.calendar = null;
                return;
            }

            // 讀取並解析 JSON 檔案
            const keyFileContent = fs.readFileSync(absoluteKeyPath, 'utf8');
            const credentials = JSON.parse(keyFileContent);

            // 驗證 JSON 檔案格式
            if (!credentials.client_email || !credentials.private_key) {
                console.error('❌ Google Service Account JSON 檔案格式不正確');
                console.error(
                    '💡 請確認檔案包含 client_email 和 private_key 欄位'
                );
                this.calendar = null;
                return;
            }

            // 使用 Service Account 驗證
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/calendar'],
            });

            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

            console.log('✅ Google Calendar Service 初始化成功');
            console.log(`📧 服務帳戶: ${credentials.client_email}`);
            console.log(`📅 目標日曆: ${this.calendarId}`);
        } catch (error) {
            console.error(
                '❌ Google Calendar Service 初始化失敗:',
                error.message
            );
            if (error.code === 'ENOENT') {
                console.error(
                    '💡 請檢查 Google Service Account JSON 檔案路徑是否正確'
                );
            } else if (error instanceof SyntaxError) {
                console.error('💡 Google Service Account JSON 檔案格式錯誤');
            }
            this.calendar = null;
        }
    }

    async createEvent(todoData) {
        if (!this.calendar) {
            console.warn('⚠️ Google Calendar 服務未啟用，跳過事件建立');
            return null;
        }

        try {
            // 根據時間段設定開始和結束時間
            let startDateTime, endDateTime;

            if (todoData.timeSlot === 'all-day') {
                // 全天事件
                const dateStr = todoData.dueDate;
                return await this.createAllDayEvent(todoData, dateStr);
            } else {
                // 計算具體時間
                let timeString;

                if (todoData.timeSlot === 'custom' && todoData.customTime) {
                    timeString = todoData.customTime;
                } else {
                    // 預設時間段
                    const defaultTimes = {
                        morning: '09:00', // 早上開始時間
                        afternoon: '14:00', // 下午開始時間
                        evening: '19:00', // 晚上開始時間
                    };
                    timeString = defaultTimes[todoData.timeSlot] || '09:00';
                }

                startDateTime = new Date(
                    `${todoData.dueDate}T${timeString}:00`
                );
                endDateTime = new Date(
                    startDateTime.getTime() + 60 * 60 * 1000
                ); // 預設1小時
            }

            // 處理多個提醒
            const reminders = todoData.reminders.map((reminder) => ({
                method: reminder.type === 'email' ? 'email' : 'popup',
                minutes:
                    reminder.minutes ||
                    this.calculateMinutes(reminder.value, reminder.unit),
            }));

            const event = {
                summary: todoData.title,
                description: todoData.description,
                location: todoData.location,
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'Asia/Taipei',
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'Asia/Taipei',
                },
                reminders: {
                    useDefault: false,
                    overrides: reminders,
                },
            };

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event,
            });

            console.log(`✅ Google Calendar 事件已建立: ${response.data.id}`);
            return response.data.id;
        } catch (error) {
            console.error('❌ 建立 Google Calendar 事件失敗:', error.message);
            // 如果是權限問題，提供詳細說明
            if (error.code === 403) {
                console.error('💡 請確認：');
                console.error(
                    '   1. Service Account 已啟用 Google Calendar API'
                );
                console.error(
                    '   2. 已將 Service Account 加入到目標日曆的共享權限'
                );
                console.error('   3. GOOGLE_CALENDAR_ID 設定正確');
            }
            throw new Error('Failed to create Google Calendar event');
        }
    }

    async updateEvent(eventId, todoData) {
        if (!this.calendar || !eventId) {
            console.warn(
                '⚠️ Google Calendar 服務未啟用或事件ID不存在，跳過事件更新'
            );
            return eventId;
        }

        try {
            // 根據時間段設定開始和結束時間
            let eventData = {
                summary: todoData.title,
                description: todoData.description,
                location: todoData.location,
            };

            if (todoData.timeSlot === 'all-day') {
                // 全天事件
                eventData.start = {
                    date: todoData.dueDate,
                    timeZone: 'Asia/Taipei',
                };
                eventData.end = {
                    date: todoData.dueDate,
                    timeZone: 'Asia/Taipei',
                };
            } else {
                // 計算具體時間
                let timeString;

                if (todoData.timeSlot === 'custom' && todoData.customTime) {
                    timeString = todoData.customTime;
                } else {
                    // 預設時間段
                    const defaultTimes = {
                        morning: '09:00', // 早上開始時間
                        afternoon: '14:00', // 下午開始時間
                        evening: '19:00', // 晚上開始時間
                    };
                    timeString = defaultTimes[todoData.timeSlot] || '09:00';
                }

                const startDateTime = new Date(
                    `${todoData.dueDate}T${timeString}:00`
                );
                const endDateTime = new Date(
                    startDateTime.getTime() + 60 * 60 * 1000
                ); // 預設1小時

                eventData.start = {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'Asia/Taipei',
                };
                eventData.end = {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'Asia/Taipei',
                };
            }

            // 處理多個提醒
            const eventReminders = todoData.reminders.map((reminder) => ({
                method: reminder.type === 'email' ? 'email' : 'popup',
                minutes:
                    reminder.minutes ||
                    this.calculateMinutes(reminder.value, reminder.unit),
            }));

            eventData.reminders = {
                useDefault: false,
                overrides: eventReminders,
            };

            await this.calendar.events.update({
                calendarId: this.calendarId,
                eventId: eventId,
                resource: eventData,
            });

            console.log(`✅ Google Calendar 事件已更新: ${eventId}`);
            return eventId;
        } catch (error) {
            console.error('❌ 更新 Google Calendar 事件失敗:', error.message);
            throw new Error('Failed to update Google Calendar event');
        }
    }

    async deleteEvent(eventId) {
        if (!this.calendar || !eventId) {
            console.warn(
                '⚠️ Google Calendar 服務未啟用或事件ID不存在，跳過事件刪除'
            );
            return;
        }

        try {
            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId,
            });

            console.log(`✅ Google Calendar 事件已刪除: ${eventId}`);
        } catch (error) {
            console.error('❌ 刪除 Google Calendar 事件失敗:', error.message);
            throw new Error('Failed to delete Google Calendar event');
        }
    }

    // 建立全天事件
    async createAllDayEvent(todoData, dateStr) {
        const reminders = todoData.reminders.map((reminder) => ({
            method: reminder.type === 'email' ? 'email' : 'popup',
            minutes:
                reminder.minutes ||
                this.calculateMinutes(reminder.value, reminder.unit),
        }));

        const event = {
            summary: todoData.title,
            description: todoData.description,
            location: todoData.location,
            start: {
                date: dateStr,
                timeZone: 'Asia/Taipei',
            },
            end: {
                date: dateStr,
                timeZone: 'Asia/Taipei',
            },
            reminders: {
                useDefault: false,
                overrides: reminders,
            },
        };

        const response = await this.calendar.events.insert({
            calendarId: this.calendarId,
            resource: event,
        });

        console.log(`✅ Google Calendar 全天事件已建立: ${response.data.id}`);
        return response.data.id;
    }

    // 測試連線方法
    async testConnection() {
        if (!this.calendar) {
            return { success: false, message: 'Google Calendar 服務未初始化' };
        }

        try {
            console.log(`🔍 正在測試連接到日曆 ID: ${this.calendarId}`);

            // 嘗試獲取日曆資訊
            const response = await this.calendar.calendars.get({
                calendarId: this.calendarId,
            });

            console.log(`✅ 成功連接到日曆: ${response.data.summary}`);
            return {
                success: true,
                message: `成功連接到日曆: ${response.data.summary}`,
                calendarName: response.data.summary,
                calendarId: this.calendarId,
            };
        } catch (error) {
            console.error(`❌ 連接日曆失敗:`, error.message);
            console.error(`📋 錯誤詳情:`, {
                code: error.code,
                status: error.status,
                calendarId: this.calendarId,
            });

            let errorMessage = `連接失敗: ${error.message}`;

            // 提供具體的錯誤建議
            if (error.code === 404 || error.message.includes('Not Found')) {
                errorMessage = `日曆 ID "${this.calendarId}" 不存在或無權限存取。請檢查：
1. 日曆 ID 是否正確
2. 服務帳戶是否已加入日曆共用權限
3. 嘗試使用 "primary" 作為日曆 ID`;
            } else if (error.code === 403) {
                errorMessage = `權限不足。請確認：
1. Google Calendar API 已啟用
2. 服務帳戶已加入目標日曆的共用權限
3. 權限設定為 "進行變更和管理共用設定"`;
            } else if (error.code === 401) {
                errorMessage = `認證失敗。請檢查：
1. JSON 憑證檔案是否正確
2. 服務帳戶是否有效
3. 私鑰是否正確`;
            }

            return {
                success: false,
                message: errorMessage,
                errorCode: error.code,
                calendarId: this.calendarId,
            };
        }
    }

    // 列出可用的日曆
    async listCalendars() {
        if (!this.calendar) {
            return { success: false, message: 'Google Calendar 服務未初始化' };
        }

        try {
            console.log('📅 正在獲取日曆列表...');

            const response = await this.calendar.calendarList.list();
            const calendars = response.data.items.map((calendar) => ({
                id: calendar.id,
                name: calendar.summary,
                description: calendar.description || '',
                accessRole: calendar.accessRole,
                primary: calendar.primary || false,
            }));

            console.log(`✅ 找到 ${calendars.length} 個日曆`);

            return {
                success: true,
                message: `找到 ${calendars.length} 個可用日曆`,
                calendars: calendars,
            };
        } catch (error) {
            console.error('❌ 獲取日曆列表失敗:', error.message);

            let errorMessage = `獲取日曆列表失敗: ${error.message}`;

            if (error.code === 403) {
                errorMessage =
                    '權限不足，無法存取日曆列表。請確認 Google Calendar API 已啟用且服務帳戶有適當權限。';
            }

            return {
                success: false,
                message: errorMessage,
                errorCode: error.code,
            };
        }
    }

    // 建立新日曆
    async createCalendar(calendarName = 'TODO List') {
        if (!this.calendar) {
            return { success: false, message: 'Google Calendar 服務未初始化' };
        }

        try {
            console.log(`📅 正在建立新日曆: ${calendarName}`);

            const calendar = {
                summary: calendarName,
                description: '由 TODO List 應用程式建立的日曆',
                timeZone: 'Asia/Taipei',
            };

            const response = await this.calendar.calendars.insert({
                resource: calendar,
            });

            const newCalendarId = response.data.id;
            console.log(`✅ 日曆建立成功: ${newCalendarId}`);

            return {
                success: true,
                message: `日曆建立成功: ${calendarName}`,
                calendarId: newCalendarId,
                calendarName: calendarName,
            };
        } catch (error) {
            console.error('❌ 建立日曆失敗:', error.message);

            return {
                success: false,
                message: `建立日曆失敗: ${error.message}`,
                errorCode: error.code,
            };
        }
    }

    // 檢查 Google Calendar 服務是否完整設定
    isServiceAvailable() {
        return this.calendar !== null;
    }

    // 檢查 Google Calendar 服務設定狀態
    getServiceStatus() {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
            return {
                available: false,
                reason: 'GOOGLE_SERVICE_ACCOUNT_KEY_FILE 環境變數未設定',
                suggestion:
                    '請在 .env 檔案中設定 GOOGLE_SERVICE_ACCOUNT_KEY_FILE',
            };
        }

        const absoluteKeyPath = path.resolve(
            __dirname,
            '..',
            process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE
        );

        if (!fs.existsSync(absoluteKeyPath)) {
            return {
                available: false,
                reason: `Google Service Account JSON 檔案不存在: ${absoluteKeyPath}`,
                suggestion:
                    '請將有效的 Google Service Account JSON 檔案放置在指定位置',
            };
        }

        if (!this.calendar) {
            return {
                available: false,
                reason: 'Google Calendar API 初始化失敗',
                suggestion: '請檢查 Service Account JSON 檔案格式和權限設定',
            };
        }

        return {
            available: true,
            reason: 'Google Calendar 服務正常運作',
            calendarId: this.calendarId,
        };
    }

    calculateMinutes(value, unit) {
        if (!value || !unit) return 10; // 預設值

        switch (unit) {
            case 'minutes':
                return value;
            case 'hours':
                return value * 60;
            case 'days':
                return value * 24 * 60;
            default:
                return value;
        }
    }
}

module.exports = new GoogleCalendarService();
