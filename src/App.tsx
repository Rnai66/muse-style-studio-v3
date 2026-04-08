import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import BottomNav from '@/components/BottomNav';
import LoadingScreen from '@/components/LoadingScreen';

const HomeScreen         = lazy(() => import('@/pages/HomeScreen'));
const GenAIStudioScreen  = lazy(() => import('@/pages/GenAIStudioScreen'));
const ImageEditorScreen  = lazy(() => import('@/editor/ImageEditorScreen'));
const DressingRoomScreen = lazy(() => import('@/pages/DressingRoomScreen'));
const LookbookScreen     = lazy(() => import('@/pages/LookbookScreen'));
const ProfileScreen      = lazy(() => import('@/pages/ProfileScreen'));
const ProfileSetupScreen = lazy(() => import('@/pages/ProfileSetupScreen'));
const StudioScreen       = lazy(() => import('@/pages/StudioScreen'));
const OccasionScreen     = lazy(() => import('@/pages/OccasionScreen'));
const CoursesScreen      = lazy(() => import('@/pages/CoursesScreen'));
const LoginScreen        = lazy(() => import('@/pages/LoginScreen'));
const RegisterScreen     = lazy(() => import('@/pages/RegisterScreen'));

// Guard component
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/profile/setup') || 
                  pathname.startsWith('/login') || 
                  pathname.startsWith('/register');

  return (
    <div className="app-root">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/"              element={<HomeScreen />} />
          <Route path="/login"         element={<LoginScreen />} />
          <Route path="/register"      element={<RegisterScreen />} />
          <Route path="/gen-ai"        element={<PrivateRoute><GenAIStudioScreen /></PrivateRoute>} />
          <Route path="/editor"        element={<PrivateRoute><ImageEditorScreen /></PrivateRoute>} />
          <Route path="/room"          element={<PrivateRoute><DressingRoomScreen /></PrivateRoute>} />
          <Route path="/lookbook"      element={<PrivateRoute><LookbookScreen /></PrivateRoute>} />
          <Route path="/profile"       element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
          <Route path="/profile/setup" element={<PrivateRoute><ProfileSetupScreen /></PrivateRoute>} />
          <Route path="/studio"        element={<StudioScreen />} />
          <Route path="/occasions"     element={<OccasionScreen />} />
          <Route path="/courses"       element={<CoursesScreen />} />
        </Routes>
      </Suspense>
      {!hideNav && <BottomNav />}
    </div>
  );
}
