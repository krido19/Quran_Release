import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import QuranList from './pages/QuranList';
import SurahDetail from './pages/SurahDetail';
import PrayerTimes from './pages/PrayerTimes';
import QiblaCompass from './pages/QiblaCompass';
import Tasbih from './pages/Tasbih';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AsmaulHusna from './pages/AsmaulHusna';
import DailyPrayers from './pages/DailyPrayers';
import Menu from './pages/Menu';

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', (data) => {
      // console.log('App opened with URL:', data.url);
      if (data.url.includes('login-callback')) {
        // Extract the path/hash from the custom scheme
        // Example: com.krido19.quran://login-callback#access_token=...
        // We want to navigate to /profile#access_token=...
        const slug = data.url.split('login-callback').pop();
        if (slug) {
          navigate('/profile' + slug);
        }
      }
    });
  }, [navigate]);

  return null;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request Location Permission
        const locationStatus = await import('@capacitor/geolocation').then(m => m.Geolocation.checkPermissions());
        if (locationStatus.location !== 'granted') {
          await import('@capacitor/geolocation').then(m => m.Geolocation.requestPermissions());
        }

        // Request Notification Permission
        const notificationStatus = await import('@capacitor/local-notifications').then(m => m.LocalNotifications.checkPermissions());
        if (notificationStatus.display !== 'granted') {
          await import('@capacitor/local-notifications').then(m => m.LocalNotifications.requestPermissions());
        }
      } catch (e) {
        console.error("Error requesting permissions:", e);
      }
    };

    requestPermissions();
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div style={{ display: showSplash ? 'none' : 'block' }}>
        <AuthProvider>
          <Router>
            <DeepLinkHandler />
            <div className="app-container">
              <Header />
              <main id="main-content">
                <Routes>
                  <Route path="/" element={<QuranList />} />
                  <Route path="/surah/:id" element={<SurahDetail />} />
                  <Route path="/prayer" element={<PrayerTimes />} />
                  <Route path="/qibla" element={<QiblaCompass />} />
                  <Route path="/tasbih" element={<Tasbih />} />
                  <Route path="/profile" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/asmaul-husna" element={<AsmaulHusna />} />
                  <Route path="/daily-prayers" element={<DailyPrayers />} />
                  <Route path="/menu" element={<Menu />} />
                </Routes>
              </main>
              <Navbar />
            </div>
          </Router>
        </AuthProvider>
      </div>
    </>
  );
}

export default App;
