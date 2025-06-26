const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['popup', 'email'],
        default: 'popup',
    },
    value: {
        type: Number,
        required: true,
        min: 1,
    },
    unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'minutes',
    },
    minutes: {
        type: Number,
        required: true,
        min: 0,
    },
});

const todoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        dueDate: {
            type: String, // YYYY-MM-DD 格式
            required: true,
            validate: {
                validator: function (v) {
                    // 驗證日期格式 YYYY-MM-DD
                    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
                    return datePattern.test(v);
                },
                message: '日期格式必須是 YYYY-MM-DD',
            },
        },
        timeSlot: {
            type: String,
            enum: ['all-day', 'morning', 'afternoon', 'evening', 'custom'],
            required: true,
            default: 'morning',
        },
        customTime: {
            type: String,
            validate: {
                validator: function (v) {
                    // 只有當 timeSlot 是 'custom' 時才需要驗證
                    if (this.timeSlot !== 'custom') return true;
                    if (!v) return false;
                    // 驗證時間格式 HH:MM，且分鐘必須是10的倍數
                    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
                    if (!timePattern.test(v)) return false;
                    const minutes = parseInt(v.split(':')[1]);
                    return minutes % 10 === 0;
                },
                message:
                    '自訂時間格式必須是 HH:MM，且分鐘數必須是10的倍數（例如：14:20）',
            },
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending',
        },
        reminders: {
            type: [reminderSchema],
            default: [
                { type: 'popup', value: 10, unit: 'minutes', minutes: 10 },
            ],
        },
        googleEventId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// 虛擬欄位：合併日期和時間為完整的 DateTime
todoSchema.virtual('dueDateTime').get(function () {
    if (!this.dueDate) {
        return null;
    }

    let timeString;

    if (this.timeSlot === 'all-day') {
        timeString = '23:59'; // 全天設為當天結束
    } else if (this.timeSlot === 'custom' && this.customTime) {
        timeString = this.customTime;
    } else {
        // 預設時間段
        const defaultTimes = {
            morning: '12:00',
            afternoon: '18:00',
            evening: '23:59',
        };
        timeString = defaultTimes[this.timeSlot] || '12:00';
    }

    return new Date(`${this.dueDate}T${timeString}:00`);
});

// 虛擬欄位：判斷是否過期
todoSchema.virtual('isOverdue').get(function () {
    if (this.status === 'completed' || this.status === 'cancelled')
        return false;
    if (!this.dueDateTime) return false;
    return this.dueDateTime < new Date();
});

// 確保虛擬欄位會被序列化
todoSchema.set('toJSON', { virtuals: true });
todoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Todo', todoSchema);
