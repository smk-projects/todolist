import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Todo, TodoState, TodoFilters } from '@/types/todo';

// 異步操作
export const fetchTodos = createAsyncThunk('todos/fetchTodos', async () => {
    const response = await fetch('/api/todos');
    if (!response.ok) {
        throw new Error('Failed to fetch todos');
    }
    return response.json();
});

export const createTodo = createAsyncThunk(
    'todos/createTodo',
    async (todoData: Omit<Todo, '_id'>) => {
        console.log('Redux createTodo 發送資料:', todoData);

        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response:', errorText);
            throw new Error(
                `Failed to create todo: ${response.status} ${errorText}`
            );
        }
        return response.json();
    }
);

export const updateTodo = createAsyncThunk(
    'todos/updateTodo',
    async ({
        id,
        todoData,
    }: {
        id: string;
        todoData: Partial<Omit<Todo, '_id'>>;
    }) => {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData),
        });
        if (!response.ok) {
            throw new Error('Failed to update todo');
        }
        return response.json();
    }
);

export const deleteTodo = createAsyncThunk(
    'todos/deleteTodo',
    async (id: string) => {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete todo');
        }
        return id;
    }
);

const initialState: TodoState = {
    todos: [],
    loading: false,
    error: null,
    isModalOpen: false,
    editingTodo: null,
    searchKeyword: '',
    filters: {
        pending: true,
        'in-progress': true,
        completed: true,
        cancelled: true,
        overdue: true,
    },
};

const todoSlice = createSlice({
    name: 'todos',
    initialState,
    reducers: {
        openModal: (state) => {
            state.isModalOpen = true;
            state.editingTodo = null;
        },
        closeModal: (state) => {
            state.isModalOpen = false;
            state.editingTodo = null;
        },
        setEditingTodo: (state, action: PayloadAction<Todo>) => {
            state.editingTodo = action.payload;
            state.isModalOpen = true;
        },
        clearError: (state) => {
            state.error = null;
        },
        setSearchKeyword: (state, action: PayloadAction<string>) => {
            state.searchKeyword = action.payload;
        },
        setFilters: (state, action: PayloadAction<TodoFilters>) => {
            state.filters = action.payload;
        },
        toggleFilter: (state, action: PayloadAction<keyof TodoFilters>) => {
            state.filters[action.payload] = !state.filters[action.payload];
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch todos
            .addCase(fetchTodos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTodos.fulfilled, (state, action) => {
                state.loading = false;
                state.todos = action.payload;
            })
            .addCase(fetchTodos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch todos';
            })
            // Create todo
            .addCase(createTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTodo.fulfilled, (state, action) => {
                state.loading = false;
                state.todos.push(action.payload);
                state.isModalOpen = false;
            })
            .addCase(createTodo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create todo';
            })
            // Update todo
            .addCase(updateTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTodo.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.todos.findIndex(
                    (todo) => todo._id === action.payload._id
                );
                if (index !== -1) {
                    state.todos[index] = action.payload;
                }
                state.isModalOpen = false;
                state.editingTodo = null;
            })
            .addCase(updateTodo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update todo';
            })
            // Delete todo
            .addCase(deleteTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTodo.fulfilled, (state, action) => {
                state.loading = false;
                state.todos = state.todos.filter(
                    (todo) => todo._id !== action.payload
                );
            })
            .addCase(deleteTodo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete todo';
            });
    },
});

export const {
    openModal,
    closeModal,
    setEditingTodo,
    clearError,
    setSearchKeyword,
    setFilters,
    toggleFilter,
} = todoSlice.actions;
export default todoSlice.reducer;
