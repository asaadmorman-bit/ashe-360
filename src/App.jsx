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
import OnboardingTracker from './pages/OnboardingTracker';
import TrainingPublic from './pages/TrainingPublic';

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

            {/* All dashboard routes require authentication */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/conmon" element={<ConMon />} />
                <Route path="/eye" element={<EyeOfEDS />} />
                <Route path="/growth" element={<Growth />} />
                <Route path="/social" element={<Social />} />
                <Route path="/training" element={<Training />} />
                <Route path="/exec" element={<ExecHub />} />
                <Route path="/platform" element={<Platform />} />
                <Route path="/qa" element={<QA />} />
                <Route path="/ato" element={<ATOTrackerPage />} />
                <Route path="/onboarding" element={<OnboardingTracker />} />
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