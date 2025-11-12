
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Charges from './components/Charges';
import Clients from './components/Clients';
import Notifications from './components/Notifications';
import Profile from './components/Profile';

export type Page = 'dashboard' | 'charges' | 'clients' | 'notifications' | 'profile';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'charges':
        return <Charges />;
      case 'clients':
        return <Clients />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50">
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </Layout>
    </div>
  );
};

export default App;
