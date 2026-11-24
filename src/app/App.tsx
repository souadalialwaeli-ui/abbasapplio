import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ConversionPage } from '../pages/Conversion/ConversionPage';
import { TrainingPage } from '../pages/Training/TrainingPage';
import { ModelsPage } from '../pages/Models/ModelsPage';
import { ProjectsPage } from '../pages/Projects/ProjectsPage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { ColabPage } from '../pages/Colab/ColabPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { HelpPage } from '../pages/Help/HelpPage';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/conversion" element={<ConversionPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/colab" element={<ColabPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </AppShell>
  );
}
