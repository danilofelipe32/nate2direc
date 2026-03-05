import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { Layout } from './components/Layout';
import { KanbanBoard } from './pages/KanbanBoard';
import { ListView } from './pages/ListView';
import { TimelineView } from './pages/TimelineView';
import { DashboardView } from './pages/DashboardView';

export default function App() {
  return (
    <TaskProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/list" element={<ListView />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </TaskProvider>
  );
}
