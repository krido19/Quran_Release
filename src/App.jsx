import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Header from './components/Header';
import QuranList from './pages/QuranList';
import SurahDetail from './pages/SurahDetail';
import PrayerTimes from './pages/PrayerTimes';
import QiblaCompass from './pages/QiblaCompass';
import Tasbih from './pages/Tasbih';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            </Routes>
          </main>
          <Navbar />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
