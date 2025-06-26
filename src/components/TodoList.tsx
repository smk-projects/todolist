'use client';

import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchTodos } from '@/store/todoSlice';
import { Todo } from '@/types/todo';
import TodoCard from './TodoCard';

const TodoList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { todos, loading, error, searchKeyword, filters } = useSelector(
        (state: RootState) => state.todos
    );

    useEffect(() => {
        dispatch(fetchTodos());
    }, [dispatch]);

    // 判斷工作是否過期
    const isExpired = (todo: Todo): boolean => {
        const now = new Date();

        // 處理 dueDate 可能包含時間的情況
        let dateStr = todo.dueDate;
        if (dateStr.includes('T')) {
            // 如果 dueDate 已經包含時間，只取日期部分
            dateStr = dateStr.split('T')[0];
        }

        let dueDateTime: Date;

        if (todo.timeSlot === 'all-day') {
            // 全天工作，設定為當天結束時間 (23:59)
            dueDateTime = new Date(`${dateStr}T23:59`);
        } else if (todo.timeSlot === 'custom' && todo.customTime) {
            // 自訂時間
            dueDateTime = new Date(`${dateStr}T${todo.customTime}`);
        } else {
            // 預設時間段
            const defaultTimes = {
                morning: '12:00',
                afternoon: '18:00',
                evening: '23:59',
            };
            const timeSlotTime =
                defaultTimes[todo.timeSlot as keyof typeof defaultTimes] ||
                '12:00';
            dueDateTime = new Date(`${dateStr}T${timeSlotTime}`);
        }

        return dueDateTime < now;
    };

    // 取得工作狀態（包含過期判斷）
    const getTodoStatus = (
        todo: Todo
    ): 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'overdue' => {
        if (todo.status === 'cancelled') {
            return 'cancelled';
        }
        if (
            isExpired(todo) &&
            todo.status !== 'completed'
        ) {
            return 'overdue';
        }
        return todo.status;
    };

    // 過濾工作項目
    const filteredTodos = useMemo(() => {
        let filtered = todos;

        // 根據狀態過濾
        filtered = filtered.filter((todo) => {
            const status = getTodoStatus(todo);
            return filters[status];
        });

        // 根據搜尋關鍵字過濾
        if (searchKeyword.trim()) {
            filtered = filtered.filter(
                (todo) =>
                    todo.title
                        .toLowerCase()
                        .includes(searchKeyword.toLowerCase()) ||
                    todo.description
                        .toLowerCase()
                        .includes(searchKeyword.toLowerCase()) ||
                    todo.location
                        .toLowerCase()
                        .includes(searchKeyword.toLowerCase())
            );
        }

        return filtered;
    }, [todos, filters, searchKeyword]);

    if (loading) {
        return (
            <div className='text-center py-5'>
                <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>載入中...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='alert alert-danger' role='alert'>
                錯誤: {error}
            </div>
        );
    }

    if (todos.length === 0) {
        return (
            <div className='text-center py-5'>
                <i className='fas fa-clipboard-list fa-3x text-muted mb-3'></i>
                <h5 className='text-muted'>還沒有工作項目</h5>
                <p className='text-muted'>
                    點擊上方的「新增工作」按鈕來新增第一個工作項目
                </p>
            </div>
        );
    }

    // 顯示搜尋無結果
    if (filteredTodos.length === 0 && searchKeyword.trim()) {
        return (
            <div className='text-center py-5'>
                <i className='fas fa-search fa-3x text-muted mb-3'></i>
                <h5 className='text-muted'>
                    查無「{searchKeyword}」相關的工作
                </h5>
                <p className='text-muted'>請嘗試其他關鍵字或調整搜尋條件</p>
            </div>
        );
    }

    // 顯示無未過期工作
    if (
        filteredTodos.length === 0 &&
        !filters.overdue &&
        (filters.pending || filters['in-progress'])
    ) {
        return (
            <div className='text-center py-5'>
                <i className='fas fa-check-circle fa-3x text-success mb-3'></i>
                <h5 className='text-muted'>沒有符合條件的工作項目</h5>
                <p className='text-muted'>請調整篩選條件或新增工作項目</p>
            </div>
        );
    }

    return (
        <div className='container'>
            <div className='row'>
                {filteredTodos.map((todo) => (
                    <TodoCard
                        key={todo._id}
                        todo={todo}
                        status={getTodoStatus(todo)}
                    />
                ))}
            </div>
        </div>
    );
};

export default TodoList;
