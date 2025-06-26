export interface Reminder {
    type: 'popup' | 'email';
    value: number;
    unit: 'minutes' | 'hours' | 'days';
    minutes: number; // 計算後的總分鐘數，用於後端相容性
}

export type TodoStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type TimeSlot =
    | 'all-day'
    | 'morning'
    | 'afternoon'
    | 'evening'
    | 'custom';

export interface Todo {
    _id?: string;
    title: string;
    description: string;
    dueDate: string; // YYYY-MM-DD 格式 (原 executeDate)
    timeSlot: TimeSlot; // 時間段選擇
    customTime?: string; // HH:MM 格式，當 timeSlot 為 'custom' 時使用
    location: string;
    status: TodoStatus;
    reminders: Reminder[];
    googleEventId?: string;
    createdAt?: string;
    updatedAt?: string;
    dueDateTime?: string; // 虛擬欄位，用於顯示完整時間
}

export interface TodoFilters {
    pending: boolean;
    'in-progress': boolean;
    completed: boolean;
    cancelled: boolean;
    overdue: boolean;
}

export interface TodoState {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    isModalOpen: boolean;
    editingTodo: Todo | null;
    searchKeyword: string;
    filters: TodoFilters;
}
