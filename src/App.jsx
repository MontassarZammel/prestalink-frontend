import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ChatWidget from './components/common/ChatWidget';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

const HomePage = lazy(() => import('./pages/client/HomePage'));
const ProvidersPage = lazy(() => import('./pages/client/ProvidersPage'));
const ProviderDetailPage = lazy(() => import('./pages/client/ProviderDetailPage'));
const ChatPage = lazy(() => import('./pages/client/ChatPage'));
const LoginPage = lazy(() => import('./pages/client/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/client/AuthPages').then(m => ({ default: m.RegisterPage })));
const PaymentPage = lazy(() => import('./pages/client/PaymentPages').then(m => ({ default: m.PaymentPage })));
const PaymentSuccessPage = lazy(() => import('./pages/client/PaymentPages').then(m => ({ default: m.PaymentSuccessPage })));
const PaymentFailedPage = lazy(() => import('./pages/client/PaymentPages').then(m => ({ default: m.PaymentFailedPage })));
const MyQuotesPage = lazy(() => import('./pages/client/MyQuotesPage'));
const ProfilePage  = lazy(() => import('./pages/client/ProfilePage'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'));
const AdminQuotes = lazy(() => import('./pages/admin/AdminQuotes'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminProviderTypes = lazy(() => import('./pages/admin/AdminProviderTypes'));

const ClientLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1" id="main-content">{children}</main>
    <Footer />
    <ChatWidget />
  </div>
);

const ProtectedAdmin = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const ProtectedUser = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement...</p>
    </div>
  </div>
);

const NotFoundPage = () => (
  <ClientLayout>
    <div className="min-h-screen flex items-center justify-center text-center px-4 pt-20">
      <div>
        <p className="text-7xl mb-6 animate-float">✦</p>
        <h1 className="font-display text-5xl font-bold text-cream mb-4">404</h1>
        <p className="text-gray-400 text-lg mb-8">Cette page n'existe pas.</p>
        <a href="/" className="btn-gold inline-flex items-center gap-2">Retour à l'accueil</a>
      </div>
    </div>
  </ClientLayout>
);

function App() {
  const { initAuth } = useAuthStore();
  const { dark } = useThemeStore();
  const location = useLocation();
  useEffect(() => { initAuth(); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 btn-gold py-2 px-4 text-sm">
        Aller au contenu
      </a>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { background: '#1a1a2e', color: '#f5f0e8', border: '1px solid #35354f', fontFamily: '"DM Sans", sans-serif', fontSize: '14px', borderRadius: '10px' },
        success: { iconTheme: { primary: '#c9a96e', secondary: '#1a1a2e' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
      }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
          <Route path="/prestataires" element={<ClientLayout><ProvidersPage /></ClientLayout>} />
          <Route path="/prestataires/:typeSlug" element={<ClientLayout><ProvidersPage /></ClientLayout>} />
          <Route path="/prestataires/:typeSlug/:providerSlug" element={<ClientLayout><ProviderDetailPage /></ClientLayout>} />
          <Route path="/chat" element={<ClientLayout><ChatPage /></ClientLayout>} />
          <Route path="/login" element={<ClientLayout><LoginPage /></ClientLayout>} />
          <Route path="/register" element={<ClientLayout><RegisterPage /></ClientLayout>} />
          <Route path="/mes-devis" element={<ProtectedUser><ClientLayout><MyQuotesPage /></ClientLayout></ProtectedUser>} />
          <Route path="/profil" element={<ProtectedUser><ClientLayout><ProfilePage /></ClientLayout></ProtectedUser>} />
          <Route path="/payment/:quoteId" element={<ProtectedUser><ClientLayout><PaymentPage /></ClientLayout></ProtectedUser>} />
          <Route path="/payment/success" element={<ClientLayout><PaymentSuccessPage /></ClientLayout>} />
          <Route path="/payment/failed" element={<ClientLayout><PaymentFailedPage /></ClientLayout>} />
          <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="prestataires" element={<AdminProviders />} />
            <Route path="categories" element={<AdminProviderTypes />} />
            <Route path="devis" element={<AdminQuotes />} />
            <Route path="chat" element={<AdminChat />} />
            <Route path="parametres" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
