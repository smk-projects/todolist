'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setEditingTodo, deleteTodo } from '@/store/todoSlice';
import { Todo, TodoStatus } from '@/types/todo';

interface TodoCardProps {
    todo: Todo;
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

const TodoCard: React.FC<TodoCardProps> = ({ todo, status }) => {
    const dispatch = useDispatch<AppDispatch>();

    const handleEdit = () => {
        dispatch(setEditingTodo(todo));
    };

    const handleDelete = () => {
        if (window.confirm('確定要刪除這個工作項目嗎？')) {
            dispatch(deleteTodo(todo._id!));
        }
    };

    const formatDateTime = (todo: Todo) => {
        const dateObj = new Date(todo.dueDate);
        const dateStr = dateObj.toLocaleDateString('zh-TW');

        let timeStr = '';

        if (todo.timeSlot === 'all-day') {
            timeStr = '全天';
        } else if (todo.timeSlot === 'custom' && todo.customTime) {
            timeStr = todo.customTime;
        } else {
            const timeSlotMap = {
                morning: '早上',
                afternoon: '下午',
                evening: '晚上',
            };
            timeStr =
                timeSlotMap[todo.timeSlot as keyof typeof timeSlotMap] ||
                '早上';
        }

        return `${dateStr} ${timeStr}`;
    };

    const getStatusInfo = (status: string) => {
        const statusMap = {
            pending: {
                text: '待處理',
                icon: 'fas fa-clock',
                class: 'bg-secondary',
            },
            'in-progress': {
                text: '處理中',
                icon: 'fas fa-play',
                class: 'bg-primary',
            },
            completed: {
                text: '已完成',
                icon: 'fas fa-check',
                class: 'bg-success',
            },
            overdue: {
                text: '已逾期',
                icon: 'fas fa-exclamation-triangle',
                class: 'bg-danger',
            },
            'cancelled': {
                text: '已取消',
                icon: 'fas fa-ban',
                class: 'bg-dark',
            },
        };
        let statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
        return statusInfo;
    };

    const getCardClass = (status: string) => {
        const baseClass = 'card todo-card h-100 position-relative';
        if (status === 'overdue') {
            return `${baseClass} expired-todo`;
        }
        if (status === 'completed') {
            return `${baseClass} completed-todo`;
        }
        return baseClass;
    };

    const formatReminders = (reminders: any[]) => {
        if (!reminders || reminders.length === 0) return '無提醒';

        return reminders
            .map((reminder) => {
                const typeText = reminder.type === 'email' ? '📧' : '🔔';

                // 優先使用新格式 (value + unit)，如果沒有則回退到舊格式 (minutes)
                let timeText = '';
                if (
                    reminder.value !== undefined &&
                    reminder.unit !== undefined
                ) {
                    const unitMap: { [key: string]: string } = {
                        minutes: '分鐘',
                        hours: '小時',
                        days: '天',
                    };
                    const unitText = unitMap[reminder.unit] || '分鐘';
                    timeText = `${reminder.value}${unitText}前`;
                } else if (reminder.minutes !== undefined) {
                    // 向後相容舊格式
                    if (reminder.minutes < 60) {
                        timeText = `${reminder.minutes}分鐘前`;
                    } else if (reminder.minutes < 1440) {
                        const hours = Math.floor(reminder.minutes / 60);
                        const minutes = reminder.minutes % 60;
                        timeText =
                            minutes > 0
                                ? `${hours}小時${minutes}分鐘前`
                                : `${hours}小時前`;
                    } else {
                        const days = Math.floor(reminder.minutes / 1440);
                        timeText = `${days}天前`;
                    }
                }

                return `${typeText} ${timeText}`;
            })
            .join(', ');
    };

    return (
        <div className='col-md-6 col-lg-4 mb-4'>
            <div className={getCardClass(status)}>
                <div className='card-body'>
                    <div className='todo-actions'>
                        <button
                            className='btn btn-sm btn-outline-primary'
                            onClick={handleEdit}
                            title='編輯'
                        >
                            <i className='fas fa-edit'></i>
                        </button>
                        <button
                            className='btn btn-sm btn-outline-danger'
                            onClick={handleDelete}
                            title='刪除'
                        >
                            <i className='fas fa-trash'></i>
                        </button>
                    </div>

                    <h5 className='card-title mb-3 pe-5'>{todo.title}</h5>
                    <p className='card-text mb-2'>{todo.description}</p>

                    <div className='mb-2'>
                        <span
                            className={`badge ${getStatusInfo(status).class}`}
                        >
                            <i
                                className={`${getStatusInfo(status).icon} me-1`}
                            ></i>
                            {getStatusInfo(status).text}
                        </span>
                    </div>

                    <div className='text-muted small'>
                        <div className='mb-1'>
                            <i className='fas fa-calendar me-2'></i>
                            預計完成: {formatDateTime(todo)}
                        </div>
                        {todo.location && (
                            <div className='mb-1'>
                                <i className='fas fa-map-marker-alt me-2'></i>
                                工作地點: {todo.location}
                            </div>
                        )}
                        <div className='mb-1'>
                            <i className='fas fa-bell me-2'></i>
                            提醒: {formatReminders(todo.reminders)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoCard;
