const express = require('express');
const { body, validationResult } = require('express-validator');
const Todo = require('../models/Todo');
const googleCalendarService = require('../services/googleCalendar');

const router = express.Router();

// 取得所有工作項目
router.get('/', async (req, res) => {
    try {
        const todos = await Todo.find().sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// 新增工作項目
router.post(
    '/',
    [
        body('title').notEmpty().withMessage('標題不能為空'),
        body('description').notEmpty().withMessage('說明不能為空'),
        body('dueDate')
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage('日期格式必須是 YYYY-MM-DD'),
        body('timeSlot')
            .isIn(['all-day', 'morning', 'afternoon', 'evening', 'custom'])
            .withMessage('時間段選擇不正確'),
        body('customTime')
            .optional()
            .matches(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/)
            .withMessage('自訂時間格式必須是 HH:MM')
            .custom((value, { req }) => {
                if (req.body.timeSlot === 'custom') {
                    if (!value) {
                        throw new Error('當選擇自訂時間時，必須提供具體時間');
                    }
                    const minutes = parseInt(value.split(':')[1]);
                    if (minutes % 10 !== 0) {
                        throw new Error('分鐘數必須是10的倍數');
                    }
                }
                return true;
            }),
        body('location').optional().trim(),
        body('status')
            .optional()
            .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
            .withMessage(
                '狀態必須是 pending、in-progress、completed 或 cancelled'
            ),
        body('reminders')
            .isArray()
            .withMessage('提醒設定必須是陣列')
            .custom((reminders) => {
                if (reminders.length === 0) {
                    throw new Error('至少需要一個提醒設定');
                }
                for (const reminder of reminders) {
                    if (
                        !reminder.type ||
                        !['popup', 'email'].includes(reminder.type)
                    ) {
                        throw new Error('提醒類型必須是 popup 或 email');
                    }
                    if (
                        typeof reminder.value !== 'number' ||
                        reminder.value < 1
                    ) {
                        throw new Error('提醒數值必須是正數');
                    }
                    if (
                        !reminder.unit ||
                        !['minutes', 'hours', 'days'].includes(reminder.unit)
                    ) {
                        throw new Error(
                            '提醒單位必須是 minutes、hours 或 days'
                        );
                    }
                    if (
                        typeof reminder.minutes !== 'number' ||
                        reminder.minutes < 0
                    ) {
                        throw new Error('提醒分鐘數必須是非負數');
                    }
                }
                return true;
            }),
    ],
    async (req, res) => {
        try {
            // 調試：顯示收到的請求資料
            console.log(
                '收到的 POST 請求資料:',
                JSON.stringify(req.body, null, 2)
            );

            // 檢查驗證錯誤
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('驗證錯誤:', errors.array());
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                title,
                description,
                dueDate,
                timeSlot,
                customTime,
                location,
                status = 'pending',
                reminders,
            } = req.body;

            // 建立新的工作項目
            const newTodo = new Todo({
                title,
                description,
                dueDate,
                timeSlot,
                customTime: timeSlot === 'custom' ? customTime : undefined,
                location,
                status,
                reminders,
            });

            // 先儲存到 MongoDB
            const savedTodo = await newTodo.save();

            // 檢查 Google Calendar 服務是否可用
            const serviceStatus = googleCalendarService.getServiceStatus();

            if (serviceStatus.available) {
                try {
                    // 同時建立 Google Calendar 事件
                    const googleEventId =
                        await googleCalendarService.createEvent({
                            title,
                            description,
                            dueDate,
                            timeSlot,
                            customTime,
                            location,
                            reminders,
                        });

                    // 更新 Google Event ID
                    if (googleEventId) {
                        savedTodo.googleEventId = googleEventId;
                        await savedTodo.save();
                        console.log(
                            `✅ Todo 已同步到 Google Calendar: ${googleEventId}`
                        );
                    }
                } catch (googleError) {
                    console.error(
                        '❌ Google Calendar 同步失敗:',
                        googleError.message
                    );
                    console.warn('⚠️ Todo 已儲存但未同步到 Google Calendar');
                }
            } else {
                console.warn(
                    '⚠️ Google Calendar 服務未設定完整，僅進行本地資料處理'
                );
                console.warn(`📋 原因: ${serviceStatus.reason}`);
                console.warn(`💡 建議: ${serviceStatus.suggestion}`);
            }

            res.status(201).json(savedTodo);
        } catch (error) {
            console.error('Error creating todo:', error);
            res.status(500).json({ error: 'Failed to create todo' });
        }
    }
);

// 更新工作項目
router.put(
    '/:id',
    [
        body('title').notEmpty().withMessage('標題不能為空'),
        body('description').notEmpty().withMessage('說明不能為空'),
        body('dueDate')
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage('日期格式必須是 YYYY-MM-DD'),
        body('timeSlot')
            .isIn(['all-day', 'morning', 'afternoon', 'evening', 'custom'])
            .withMessage('時間段選擇不正確'),
        body('customTime')
            .optional()
            .matches(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/)
            .withMessage('自訂時間格式必須是 HH:MM')
            .custom((value, { req }) => {
                if (req.body.timeSlot === 'custom') {
                    if (!value) {
                        throw new Error('當選擇自訂時間時，必須提供具體時間');
                    }
                    const minutes = parseInt(value.split(':')[1]);
                    if (minutes % 10 !== 0) {
                        throw new Error('分鐘數必須是10的倍數');
                    }
                }
                return true;
            }),
        body('location').optional().trim(),
        body('status')
            .optional()
            .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
            .withMessage(
                '狀態必須是 pending、in-progress、completed 或 cancelled'
            ),
        body('reminders')
            .isArray()
            .withMessage('提醒設定必須是陣列')
            .custom((reminders) => {
                if (reminders.length === 0) {
                    throw new Error('至少需要一個提醒設定');
                }
                for (const reminder of reminders) {
                    if (
                        !reminder.type ||
                        !['popup', 'email'].includes(reminder.type)
                    ) {
                        throw new Error('提醒類型必須是 popup 或 email');
                    }
                    if (
                        typeof reminder.value !== 'number' ||
                        reminder.value < 1
                    ) {
                        throw new Error('提醒數值必須是正數');
                    }
                    if (
                        !reminder.unit ||
                        !['minutes', 'hours', 'days'].includes(reminder.unit)
                    ) {
                        throw new Error(
                            '提醒單位必須是 minutes、hours 或 days'
                        );
                    }
                    if (
                        typeof reminder.minutes !== 'number' ||
                        reminder.minutes < 0
                    ) {
                        throw new Error('提醒分鐘數必須是非負數');
                    }
                }
                return true;
            }),
    ],
    async (req, res) => {
        try {
            // 檢查驗證錯誤
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const {
                title,
                description,
                dueDate,
                timeSlot,
                customTime,
                location,
                status,
                reminders,
            } = req.body;

            // 尋找現有的工作項目
            const existingTodo = await Todo.findById(id);
            if (!existingTodo) {
                return res.status(404).json({ error: 'Todo not found' });
            }

            // 更新 MongoDB
            const updatedTodo = await Todo.findByIdAndUpdate(
                id,
                {
                    title,
                    description,
                    dueDate,
                    timeSlot,
                    customTime: timeSlot === 'custom' ? customTime : undefined,
                    location,
                    status,
                    reminders,
                },
                { new: true }
            );

            // 檢查 Google Calendar 服務是否可用
            const serviceStatus = googleCalendarService.getServiceStatus();

            if (serviceStatus.available) {
                try {
                    // 更新 Google Calendar 事件
                    if (existingTodo.googleEventId) {
                        await googleCalendarService.updateEvent(
                            existingTodo.googleEventId,
                            {
                                title,
                                description,
                                dueDate,
                                timeSlot,
                                customTime,
                                location,
                                reminders,
                            }
                        );
                        console.log(
                            `✅ Todo 已在 Google Calendar 中更新: ${existingTodo.googleEventId}`
                        );
                    }
                } catch (googleError) {
                    console.error(
                        '❌ Google Calendar 更新失敗:',
                        googleError.message
                    );
                    console.warn('⚠️ Todo 已更新但 Google Calendar 同步失敗');
                }
            } else {
                console.warn(
                    '⚠️ Google Calendar 服務未設定完整，僅進行本地資料更新'
                );
                console.warn(`📋 原因: ${serviceStatus.reason}`);
            }

            res.json(updatedTodo);
        } catch (error) {
            console.error('Error updating todo:', error);
            res.status(500).json({ error: 'Failed to update todo' });
        }
    }
);

// 刪除工作項目
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 尋找要刪除的工作項目
        const todoToDelete = await Todo.findById(id);
        if (!todoToDelete) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // 檢查 Google Calendar 服務是否可用
        const serviceStatus = googleCalendarService.getServiceStatus();

        if (serviceStatus.available) {
            try {
                // 從 Google Calendar 刪除事件
                if (todoToDelete.googleEventId) {
                    await googleCalendarService.deleteEvent(
                        todoToDelete.googleEventId
                    );
                    console.log(
                        `✅ 事件已從 Google Calendar 中刪除: ${todoToDelete.googleEventId}`
                    );
                }
            } catch (googleError) {
                console.error(
                    '❌ Google Calendar 刪除失敗:',
                    googleError.message
                );
                console.warn('⚠️ 將繼續刪除本地資料');
            }
        } else {
            console.warn(
                '⚠️ Google Calendar 服務未設定完整，僅進行本地資料刪除'
            );
            console.warn(`📋 原因: ${serviceStatus.reason}`);
        }

        // 從 MongoDB 刪除
        await Todo.findByIdAndDelete(id);

        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// 取得單一工作項目
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json(todo);
    } catch (error) {
        console.error('Error fetching todo:', error);
        res.status(500).json({ error: 'Failed to fetch todo' });
    }
});

module.exports = router;
