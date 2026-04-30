import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import ConMon from './pages/ConMon';
import EyeOfEDS from './pages/EyeOfEDS';
import Growth from './pages/Growth';
import Social from './pages/Social';
import Training from './pages/Training';
import ExecHub from './pages/ExecHub';
import Platform from './pages/Platform';
import QA from './pages/QA';
import ATOTrackerPage from './pages/ATOTracker';
import EDSHome from './pages/EDSHome.jsx';
import ServicesPage from './pages/eds/ServicesPage';
import CompliancePage from './pages/eds/CompliancePage';
import CaseStudiesPage from './pages/eds/CaseStudiesPage';
import PricingPage from './pages/eds/PricingPage';
import CICDPage from './pages/eds/CICDPage';
import AboutPage from './pages/eds/AboutPage';
import ContactPage from './pages/eds/ContactPage';
import ClientPortal from './pages/ClientPortal';
import ClientDashboard from './pages/ClientDashboard';
import OnboardingTracker from './pages/OnboardingTracker';
import TrainingPublic from './pages/TrainingPublic';
import ASHE from './pages/ASHE';
import ThreatIntel from './pages/ThreatIntel';
import SecurityHealth from './pages/SecurityHealth';
import RoleGuard from './components/layout/RoleGuard';
import TeamDirectory from './pages/TeamDirectory';

// Gate that enforces auth for all dashboard routes
const RequireAuth = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Public marketing pages — no auth required */}
            <Route path="/" element={<EDSHome />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/case-studies" element={<CaseStudiesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/cicd" element={<CICDPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/portal" element={<ClientPortal />} />
            <Route path="/training-register" element={<TrainingPublic />} />
            <Route path="/ashe" element={<ASHE />} />

            {/* All dashboard routes require authentication */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard"       element={<ClientDashboard />} />
                <Route path="/conmon"          element={<RoleGuard path="/conmon"><ConMon /></RoleGuard>} />
                <Route path="/eye"             element={<RoleGuard path="/eye"><EyeOfEDS /></RoleGuard>} />
                <Route path="/threat-intel"    element={<RoleGuard path="/threat-intel"><ThreatIntel /></RoleGuard>} />
                <Route path="/security-health" element={<RoleGuard path="/security-health"><SecurityHealth /></RoleGuard>} />
                <Route path="/ato"             element={<RoleGuard path="/ato"><ATOTrackerPage /></RoleGuard>} />
                <Route path="/growth"          element={<RoleGuard path="/growth"><Growth /></RoleGuard>} />
                <Route path="/social"          element={<RoleGuard path="/social"><Social /></RoleGuard>} />
                <Route path="/training"        element={<Training />} />
                <Route path="/exec"            element={<RoleGuard path="/exec"><ExecHub /></RoleGuard>} />
                <Route path="/platform"        element={<RoleGuard path="/platform"><Platform /></RoleGuard>} />
                <Route path="/qa"              element={<RoleGuard path="/qa"><QA /></RoleGuard>} />
                <Route path="/onboarding"      element={<RoleGuard path="/onboarding"><OnboardingTracker /></RoleGuard>} />
                <Route path="/directory"       element={<TeamDirectory />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;