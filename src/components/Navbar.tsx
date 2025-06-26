'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { openModal, setSearchKeyword, toggleFilter } from '@/store/todoSlice';
import { TodoFilters } from '@/types/todo';

const Navbar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { searchKeyword, filters } = useSelector(
        (state: RootState) => state.todos
    );

    const [searchInput, setSearchInput] = useState(searchKeyword);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Debounce 搜尋 - 延遲 500ms 後才執行搜尋
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(setSearchKeyword(searchInput));
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput, dispatch]);

    // 點擊外部關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.dropdown')) {
                setShowFilterDropdown(false);
            }
        };

        if (showFilterDropdown) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showFilterDropdown]);

    const handleAddTodo = () => {
        dispatch(openModal());
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };

    const handleFilterToggle = (filterKey: keyof TodoFilters) => {
        dispatch(toggleFilter(filterKey));
    };

    const getFilterLabel = () => {
        const activeFilters = Object.entries(filters).filter(
            ([_, active]) => active
        );
        if (activeFilters.length === 5) return '全部狀態';
        if (activeFilters.length === 0) return '無篩選';

        const labels: Record<keyof TodoFilters, string> = {
            pending: '待處理',
            'in-progress': '處理中',
            completed: '已完成',
            cancelled: '已取消',
            overdue: '已逾期',
        };

        return activeFilters
            .map(([key]) => labels[key as keyof TodoFilters])
            .join(', ');
    };

    return (
        <nav className='navbar navbar-expand-lg navbar-dark bg-primary mb-4'>
            <div className='container'>
                {/* 桌面版佈局 */}
                <div className='d-none d-lg-flex w-100 align-items-center'>
                    <span className='navbar-brand mb-0'>TODO LIST</span>

                    {/* 搜尋輸入框 - 靠左 */}
                    <div
                        className='input-group mx-3'
                        style={{ width: '300px' }}
                    >
                        <span className='input-group-text bg-white border-end-0'>
                            <i className='fas fa-search text-muted'></i>
                        </span>
                        <input
                            type='text'
                            className='form-control border-start-0'
                            placeholder='搜尋工作...'
                            value={searchInput}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* 右側功能區 - 靠右 */}
                    <div className='d-flex align-items-center gap-3 ms-auto'>
                        {/* 狀態篩選下拉選單 */}
                        <div className='dropdown'>
                            <button
                                className='btn btn-outline-light btn-sm dropdown-toggle'
                                type='button'
                                onClick={() =>
                                    setShowFilterDropdown(!showFilterDropdown)
                                }
                            >
                                <i className='fas fa-filter me-2'></i>
                                {getFilterLabel()}
                            </button>
                            {showFilterDropdown && (
                                <div
                                    className='dropdown-menu show'
                                    style={{ minWidth: '200px' }}
                                >
                                    <div className='px-3 py-2'>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-pending'
                                                checked={filters.pending}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'pending'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-pending'
                                            >
                                                待處理
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-in-progress'
                                                checked={filters['in-progress']}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'in-progress'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-in-progress'
                                            >
                                                處理中
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-completed'
                                                checked={filters.completed}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'completed'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-completed'
                                            >
                                                已完成
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-cancelled'
                                                checked={filters.cancelled}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'cancelled'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-cancelled'
                                            >
                                                已取消
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-overdue'
                                                checked={filters.overdue}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'overdue'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-overdue'
                                            >
                                                已逾期
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 新增工作按鈕 */}
                        <button
                            className='btn btn-light'
                            onClick={handleAddTodo}
                        >
                            <i className='fas fa-plus me-2'></i>
                            新增工作
                        </button>
                    </div>
                </div>

                {/* 手機版佈局 */}
                <div className='d-lg-none w-100'>
                    {/* 第一行：標題 */}
                    <div className='d-flex justify-content-center mb-3'>
                        <span className='navbar-brand mb-0'>TODO LIST</span>
                    </div>

                    {/* 第二行：搜尋框 (100% 寬度) */}
                    <div className='input-group mb-3'>
                        <span className='input-group-text bg-white border-end-0'>
                            <i className='fas fa-search text-muted'></i>
                        </span>
                        <input
                            type='text'
                            className='form-control border-start-0'
                            placeholder='搜尋工作...'
                            value={searchInput}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* 第三行：左邊篩選，右邊按鈕 */}
                    <div className='d-flex justify-content-between align-items-center'>
                        {/* 狀態篩選下拉選單 */}
                        <div className='dropdown'>
                            <button
                                className='btn btn-outline-light btn-sm dropdown-toggle'
                                type='button'
                                onClick={() =>
                                    setShowFilterDropdown(!showFilterDropdown)
                                }
                            >
                                <i className='fas fa-filter me-1'></i>
                                篩選
                            </button>
                            {showFilterDropdown && (
                                <div
                                    className='dropdown-menu show'
                                    style={{ minWidth: '180px' }}
                                >
                                    <div className='px-3 py-2'>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-pending-mobile'
                                                checked={filters.pending}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'pending'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-pending-mobile'
                                            >
                                                待處理
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-in-progress-mobile'
                                                checked={filters['in-progress']}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'in-progress'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-in-progress-mobile'
                                            >
                                                處理中
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-completed-mobile'
                                                checked={filters.completed}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'completed'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-completed-mobile'
                                            >
                                                已完成
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-cancelled-mobile'
                                                checked={filters.cancelled}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'cancelled'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-cancelled-mobile'
                                            >
                                                已取消
                                            </label>
                                        </div>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='filter-overdue-mobile'
                                                checked={filters.overdue}
                                                onChange={() =>
                                                    handleFilterToggle(
                                                        'overdue'
                                                    )
                                                }
                                            />
                                            <label
                                                className='form-check-label'
                                                htmlFor='filter-overdue-mobile'
                                            >
                                                已逾期
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 新增工作按鈕 */}
                        <button
                            className='btn btn-light'
                            onClick={handleAddTodo}
                        >
                            <i className='fas fa-plus me-2'></i>
                            新增工作
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
