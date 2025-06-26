'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DatePicker from 'react-datepicker';
import { RootState, AppDispatch } from '@/store';
import { closeModal, createTodo, updateTodo } from '@/store/todoSlice';
import { Todo, Reminder, TodoStatus, TimeSlot } from '@/types/todo';

import 'react-datepicker/dist/react-datepicker.css';

const TodoModal: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isModalOpen, editingTodo, loading } = useSelector(
        (state: RootState) => state.todos
    );

    // 工作標題輸入框的 ref
    const titleInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        timeSlot: 'all-day' as TimeSlot,
        customTime: '09:00',
        location: '',
        status: 'pending' as TodoStatus,
        reminders: [
            {
                type: 'popup' as const,
                value: 10,
                unit: 'minutes' as const,
                minutes: 10,
            },
        ] as Reminder[],
    });

    // DatePicker 的日期狀態
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // 過期警告狀態
    const [isExpiredWarning, setIsExpiredWarning] = useState(false);

    // 生成小時選項 (00-23)
    const generateHourOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            options.push(hour.toString().padStart(2, '0'));
        }
        return options;
    };

    // 生成分鐘選項 (每10分鐘一個: 00, 10, 20, 30, 40, 50)
    const generateMinuteOptions = () => {
        const options = [];
        for (let minute = 0; minute < 60; minute += 10) {
            options.push(minute.toString().padStart(2, '0'));
        }
        return options;
    };

    const hourOptions = generateHourOptions();
    const minuteOptions = generateMinuteOptions();

    useEffect(() => {
        if (editingTodo) {
            // 設定日期
            const dueDate = editingTodo.dueDate.includes('T')
                ? editingTodo.dueDate.split('T')[0]
                : editingTodo.dueDate;

            // 設定 DatePicker 日期
            setSelectedDate(new Date(dueDate));

            setFormData({
                title: editingTodo.title,
                description: editingTodo.description,
                dueDate: dueDate,
                timeSlot: editingTodo.timeSlot,
                customTime: editingTodo.customTime || '09:00',
                location: editingTodo.location,
                status: editingTodo.status,
                reminders:
                    editingTodo.reminders.length > 0
                        ? editingTodo.reminders
                        : [
                            {
                                type: 'popup',
                                value: 10,
                                unit: 'minutes',
                                minutes: 10,
                            },
                        ],
            });
        } else {
            // 設定預設日期和時間為當前時間的一小時後
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 加一小時

            const defaultDate = oneHourLater.toISOString().split('T')[0];

            // 分鐘調整為最接近的10分鐘倍數（向上取整）
            const currentMinutes = oneHourLater.getMinutes();
            const roundedMinutes = Math.ceil(currentMinutes / 10) * 10;
            const defaultMinute = (roundedMinutes >= 60 ? 0 : roundedMinutes)
                .toString()
                .padStart(2, '0');

            // 如果分鐘進位了，小時也要調整
            const finalHour =
                roundedMinutes >= 60
                    ? ((oneHourLater.getHours() + 1) % 24)
                        .toString()
                        .padStart(2, '0')
                    : oneHourLater.getHours().toString().padStart(2, '0');

            const defaultTime = `${finalHour}:${defaultMinute}`;

            // 設定 DatePicker 日期
            setSelectedDate(oneHourLater);

            setFormData({
                title: '',
                description: '',
                dueDate: defaultDate,
                timeSlot: 'all-day',
                customTime: defaultTime,
                location: '',
                status: 'pending',
                reminders: [
                    { type: 'popup', value: 10, unit: 'minutes', minutes: 10 },
                ],
            });
        }
    }, [editingTodo, isModalOpen]);

    // 檢查是否為過期時間
    useEffect(() => {
        if (
            formData.dueDate &&
            (formData.timeSlot === 'custom' ? formData.customTime : true)
        ) {
            const now = new Date();
            let dueDateTime: Date;

            if (formData.timeSlot === 'all-day') {
                // 全天工作，設定為當天結束時間 (23:59)
                dueDateTime = new Date(`${formData.dueDate}T23:59`);
            } else if (formData.timeSlot === 'custom' && formData.customTime) {
                // 自訂時間
                dueDateTime = new Date(
                    `${formData.dueDate}T${formData.customTime}`
                );
            } else {
                // 預設時間段
                const defaultTimes = {
                    morning: '12:00',
                    afternoon: '18:00',
                    evening: '23:59',
                };
                const timeSlotTime =
                    defaultTimes[
                    formData.timeSlot as keyof typeof defaultTimes
                    ] || '12:00';
                dueDateTime = new Date(`${formData.dueDate}T${timeSlotTime}`);
            }

            setIsExpiredWarning(dueDateTime < now);
        }
    }, [formData.dueDate, formData.timeSlot, formData.customTime]);

    const handleClose = () => {
        dispatch(closeModal());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 調試：顯示提交的資料
        console.log('提交的表單資料:', formData);

        // 檢查是否為過期時間
        const now = new Date();
        let dueDateTime: Date;

        if (formData.timeSlot === 'all-day') {
            // 全天工作，設定為當天結束時間 (23:59)
            dueDateTime = new Date(`${formData.dueDate}T23:59`);
        } else if (formData.timeSlot === 'custom' && formData.customTime) {
            // 自訂時間
            dueDateTime = new Date(
                `${formData.dueDate}T${formData.customTime}`
            );
        } else {
            // 預設時間段
            const defaultTimes = {
                morning: '12:00',
                afternoon: '18:00',
                evening: '23:59',
            };
            const timeSlotTime =
                defaultTimes[formData.timeSlot as keyof typeof defaultTimes] ||
                '12:00';
            dueDateTime = new Date(`${formData.dueDate}T${timeSlotTime}`);
        }

        if (dueDateTime < now) {
            const confirmMessage = `您輸入的預計完成時間是 ${dueDateTime.toLocaleString('zh-TW')}，這是一個已經過期的時間。\n\n確定要繼續建立這個工作項目嗎？`;

            if (!window.confirm(confirmMessage)) {
                // 使用者選擇不繼續，停留在表單讓他修改
                return;
            }
        }

        if (editingTodo) {
            dispatch(
                updateTodo({
                    id: editingTodo._id!,
                    todoData: formData,
                })
            );
        } else {
            // 建立要提交的資料，只在 timeSlot 為 custom 時包含 customTime
            const submitData = {
                ...formData,
                ...(formData.timeSlot === 'custom'
                    ? { customTime: formData.customTime }
                    : {}),
            };

            // 如果不是 custom，移除 customTime 欄位
            if (formData.timeSlot !== 'custom') {
                delete (submitData as any).customTime;
            }

            console.log('實際提交資料:', submitData);
            dispatch(createTodo(submitData));
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 處理 DatePicker 日期變更
    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            const dateString = date.toISOString().split('T')[0];
            setFormData((prev) => ({
                ...prev,
                dueDate: dateString,
            }));
        }
    };

    // 處理自訂時間變更
    const handleCustomTimeChange = (timeString: string) => {
        setFormData((prev) => ({
            ...prev,
            customTime: timeString,
        }));
    };

    const handleAddReminder = () => {
        setFormData((prev) => ({
            ...prev,
            reminders: [
                ...prev.reminders,
                { type: 'popup', value: 10, unit: 'minutes', minutes: 10 },
            ],
        }));
    };

    const handleRemoveReminder = (index: number) => {
        if (formData.reminders.length > 1) {
            setFormData((prev) => ({
                ...prev,
                reminders: prev.reminders.filter((_, i) => i !== index),
            }));
        }
    };

    const handleReminderChange = (
        index: number,
        field: keyof Reminder,
        value: string | number
    ) => {
        setFormData((prev) => ({
            ...prev,
            reminders: prev.reminders.map((reminder, i) => {
                if (i === index) {
                    const updatedReminder = { ...reminder, [field]: value };
                    // 當 value 或 unit 改變時，重新計算 minutes
                    if (field === 'value' || field === 'unit') {
                        updatedReminder.minutes = calculateMinutes(
                            field === 'value'
                                ? (value as number)
                                : reminder.value,
                            field === 'unit' ? (value as string) : reminder.unit
                        );
                    }
                    return updatedReminder;
                }
                return reminder;
            }),
        }));
    };

    const calculateMinutes = (value: number, unit: string) => {
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
    };

    const getReminderText = (value: number, unit: string) => {
        const unitText =
            {
                minutes: '分鐘',
                hours: '小時',
                days: '天',
            }[unit] || '分鐘';

        return `${value} ${unitText}前`;
    };

    // 自動 focus 工作標題輸入框
    useEffect(() => {
        if (isModalOpen && !editingTodo && titleInputRef.current) {
            // 新增模式下，延遲一點時間確保 modal 完全顯示後再 focus
            const timer = setTimeout(() => {
                titleInputRef.current?.focus();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isModalOpen, editingTodo]);

    if (!isModalOpen) return null;

    return (
        <div
            className='modal show d-block'
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className='modal-dialog modal-lg'>
                <div className='modal-content'>
                    <div className='modal-header'>
                        <h5 className='modal-title'>
                            {editingTodo ? '編輯工作項目' : '新增工作項目'}
                        </h5>
                        <button
                            type='button'
                            className='btn-close'
                            onClick={handleClose}
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className='modal-body'>
                            <div className='mb-3'>
                                <label htmlFor='title' className='form-label'>
                                    工作標題
                                </label>
                                <input
                                    type='text'
                                    className='form-control'
                                    id='title'
                                    name='title'
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    ref={titleInputRef}
                                />
                            </div>

                            <div className='mb-3'>
                                <label
                                    htmlFor='description'
                                    className='form-label'
                                >
                                    工作說明
                                </label>
                                <textarea
                                    className='form-control'
                                    id='description'
                                    name='description'
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            <div className='row mb-3'>
                                <div className='col-md-6'>
                                    <label className='form-label'>
                                        預計完成日期
                                    </label>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat='yyyy-MM-dd'
                                        className='form-control'
                                        placeholderText='選擇日期'
                                        showPopperArrow={false}
                                        required
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <select
                                        className='form-control'
                                        name='timeSlot'
                                        value={formData.timeSlot}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value='all-day'>全天</option>
                                        <option value='morning'>
                                            早上 (到中午12點)
                                        </option>
                                        <option value='afternoon'>
                                            下午 (到傍晚6點)
                                        </option>
                                        <option value='evening'>
                                            晚上 (到深夜)
                                        </option>
                                        <option value='custom'>自訂時間</option>
                                    </select>

                                    {formData.timeSlot === 'custom' && (
                                        <div className='mt-2'>
                                            <label className='form-label small'>
                                                自訂時間
                                            </label>
                                            <div className='row'>
                                                <div className='col-6'>
                                                    <select
                                                        className='form-control time-select'
                                                        value={
                                                            formData.customTime.split(
                                                                ':'
                                                            )[0]
                                                        }
                                                        onChange={(e) => {
                                                            const hour =
                                                                e.target.value;
                                                            const minute =
                                                                formData.customTime.split(
                                                                    ':'
                                                                )[1] || '00';
                                                            handleCustomTimeChange(
                                                                `${hour}:${minute}`
                                                            );
                                                        }}
                                                        required
                                                    >
                                                        {hourOptions.map(
                                                            (hour) => (
                                                                <option
                                                                    key={hour}
                                                                    value={hour}
                                                                >
                                                                    {hour}點
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                                <div className='col-6'>
                                                    <select
                                                        className='form-control time-select'
                                                        value={
                                                            formData.customTime.split(
                                                                ':'
                                                            )[1] || '00'
                                                        }
                                                        onChange={(e) => {
                                                            const hour =
                                                                formData.customTime.split(
                                                                    ':'
                                                                )[0] || '09';
                                                            const minute =
                                                                e.target.value;
                                                            handleCustomTimeChange(
                                                                `${hour}:${minute}`
                                                            );
                                                        }}
                                                        required
                                                    >
                                                        {minuteOptions.map(
                                                            (minute) => (
                                                                <option
                                                                    key={minute}
                                                                    value={
                                                                        minute
                                                                    }
                                                                >
                                                                    {minute}分
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {isExpiredWarning && (
                                    <div className='col-12 mt-2'>
                                        <div className='alert alert-warning py-2'>
                                            <i className='fas fa-exclamation-triangle me-2'></i>
                                            <strong>注意：</strong>
                                            您選擇的預計完成時間已經過期。如果繼續建立，此工作項目將顯示為過期狀態。
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className='row mb-3'>
                                <div className='col-md-6 mb-3 mb-md-0'>
                                    <label
                                        htmlFor='location'
                                        className='form-label'
                                    >
                                        工作地點
                                    </label>
                                    <input
                                        type='text'
                                        className='form-control'
                                        id='location'
                                        name='location'
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder='選填：工作執行的地點'
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <label
                                        htmlFor='status'
                                        className='form-label'
                                    >
                                        工作狀態
                                    </label>
                                    <select
                                        className='form-control'
                                        id='status'
                                        name='status'
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value='pending'>待處理</option>
                                        <option value='in-progress'>
                                            處理中
                                        </option>
                                        <option value='completed'>
                                            已完成
                                        </option>
                                        <option value='cancelled'>
                                            已取消
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className='mb-3'>
                                <label className='form-label'>
                                    提醒設定
                                    <button
                                        type='button'
                                        className='btn btn-sm btn-outline-primary ms-2'
                                        onClick={handleAddReminder}
                                    >
                                        <i className='fas fa-plus'></i> 新增提醒
                                    </button>
                                </label>

                                {formData.reminders.map((reminder, index) => (
                                    <div key={index} className='card mb-2'>
                                        <div className='card-body py-2'>
                                            {/* 桌面版佈局 */}
                                            <div className='d-none d-md-flex align-items-center'>
                                                <div className='col-md-3'>
                                                    <select
                                                        className='form-control form-control-sm'
                                                        value={reminder.type}
                                                        onChange={(e) =>
                                                            handleReminderChange(
                                                                index,
                                                                'type',
                                                                e.target
                                                                    .value as
                                                                | 'popup'
                                                                | 'email'
                                                            )
                                                        }
                                                    >
                                                        <option value='popup'>
                                                            彈出通知
                                                        </option>
                                                        <option value='email'>
                                                            電子郵件
                                                        </option>
                                                    </select>
                                                </div>
                                                <div className='col-md-2'>
                                                    <input
                                                        type='number'
                                                        className='form-control form-control-sm'
                                                        value={reminder.value}
                                                        onChange={(e) =>
                                                            handleReminderChange(
                                                                index,
                                                                'value',
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 1
                                                            )
                                                        }
                                                        min='1'
                                                        step='1'
                                                    />
                                                </div>
                                                <div className='col-md-3'>
                                                    <select
                                                        className='form-control form-control-sm'
                                                        value={reminder.unit}
                                                        onChange={(e) =>
                                                            handleReminderChange(
                                                                index,
                                                                'unit',
                                                                e.target
                                                                    .value as
                                                                | 'minutes'
                                                                | 'hours'
                                                                | 'days'
                                                            )
                                                        }
                                                    >
                                                        <option value='minutes'>
                                                            分鐘前
                                                        </option>
                                                        <option value='hours'>
                                                            小時前
                                                        </option>
                                                        <option value='days'>
                                                            天前
                                                        </option>
                                                    </select>
                                                </div>
                                                <div className='col-md-3'>
                                                    <small className='text-muted'>
                                                        {getReminderText(
                                                            reminder.value,
                                                            reminder.unit
                                                        )}
                                                    </small>
                                                </div>
                                                <div className='col-md-1'>
                                                    {formData.reminders.length >
                                                        1 && (
                                                            <button
                                                                type='button'
                                                                className='btn btn-sm btn-outline-danger'
                                                                onClick={() =>
                                                                    handleRemoveReminder(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <i className='fas fa-trash'></i>
                                                            </button>
                                                        )}
                                                </div>
                                            </div>

                                            {/* 手機版佈局 */}
                                            <div className='d-md-none'>
                                                {/* 第一行：提醒類型和刪除按鈕 */}
                                                <div className='d-flex justify-content-between align-items-center mb-2'>
                                                    <div className='flex-grow-1 me-2'>
                                                        <label className='form-label small mb-1'>
                                                            提醒方式
                                                        </label>
                                                        <select
                                                            className='form-control form-control-sm'
                                                            value={
                                                                reminder.type
                                                            }
                                                            onChange={(e) =>
                                                                handleReminderChange(
                                                                    index,
                                                                    'type',
                                                                    e.target
                                                                        .value as
                                                                    | 'popup'
                                                                    | 'email'
                                                                )
                                                            }
                                                        >
                                                            <option value='popup'>
                                                                彈出通知
                                                            </option>
                                                            <option value='email'>
                                                                電子郵件
                                                            </option>
                                                        </select>
                                                    </div>
                                                    {formData.reminders.length >
                                                        1 && (
                                                            <button
                                                                type='button'
                                                                className='btn btn-sm btn-outline-danger'
                                                                onClick={() =>
                                                                    handleRemoveReminder(
                                                                        index
                                                                    )
                                                                }
                                                                style={{
                                                                    marginTop:
                                                                        '24px',
                                                                }}
                                                            >
                                                                <i className='fas fa-trash'></i>
                                                            </button>
                                                        )}
                                                </div>

                                                {/* 第二行：時間設定 */}
                                                <div className='row'>
                                                    <div className='col-4'>
                                                        <input
                                                            type='number'
                                                            className='form-control form-control-sm'
                                                            value={
                                                                reminder.value
                                                            }
                                                            onChange={(e) =>
                                                                handleReminderChange(
                                                                    index,
                                                                    'value',
                                                                    parseInt(
                                                                        e.target
                                                                            .value
                                                                    ) || 1
                                                                )
                                                            }
                                                            min='1'
                                                            step='1'
                                                            placeholder='數量'
                                                        />
                                                    </div>
                                                    <div className='col-8'>
                                                        <select
                                                            className='form-control form-control-sm'
                                                            value={
                                                                reminder.unit
                                                            }
                                                            onChange={(e) =>
                                                                handleReminderChange(
                                                                    index,
                                                                    'unit',
                                                                    e.target
                                                                        .value as
                                                                    | 'minutes'
                                                                    | 'hours'
                                                                    | 'days'
                                                                )
                                                            }
                                                        >
                                                            <option value='minutes'>
                                                                分鐘前
                                                            </option>
                                                            <option value='hours'>
                                                                小時前
                                                            </option>
                                                            <option value='days'>
                                                                天前
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* 第三行：預覽文字 */}
                                                <div className='mt-2'>
                                                    <small className='text-muted'>
                                                        <i className='fas fa-info-circle me-1'></i>
                                                        {getReminderText(
                                                            reminder.value,
                                                            reminder.unit
                                                        )}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='modal-footer'>
                            <button
                                type='button'
                                className='btn btn-secondary'
                                onClick={handleClose}
                            >
                                取消
                            </button>
                            <button
                                type='submit'
                                className='btn btn-primary'
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className='spinner-border spinner-border-sm me-2'></span>
                                        儲存中...
                                    </>
                                ) : (
                                    '儲存'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TodoModal;
