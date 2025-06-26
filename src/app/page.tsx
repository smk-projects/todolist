'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import Navbar from '@/components/Navbar';
import TodoList from '@/components/TodoList';
import TodoModal from '@/components/TodoModal';
import '@/assets/scss/global.scss';

const HomePage: React.FC = () => {
    return (
        <Provider store={store}>
            <div className='min-vh-100'>
                <Navbar />
                <main>
                    <TodoList />
                </main>
                <TodoModal />
            </div>
        </Provider>
    );
};

export default HomePage;
