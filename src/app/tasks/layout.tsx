import { ToastProvider } from '@/components/tasks/Toast';
import BottomNav from '@/components/tasks/BottomNav';

export const metadata = {
  title: 'TASUKI - タスクを繋ぐ',
  description: 'タスクを繋ぐ業務管理システム',
  manifest: '/manifest.json',
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 72 }}>
        {children}
      </div>
      <BottomNav />
    </ToastProvider>
  );
}
