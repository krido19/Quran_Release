import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Motion } from '@capacitor/motion';

export default function QiblaCompass() {
    const [heading, setHeading] = useState(0);
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [cityName, setCityName] = useState(null);
    const [showCalibration, setShowCalibration] = useState(false);

    const handleCalibration = async () => {
        // Request permission for iOS 13+
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    setShowCalibration(true);
                } else {
                    alert("Izin akses sensor ditolak.");
                }
            } catch (e) {
                console.error(e);
                setShowCalibration(true); // Show instructions anyway
            }
        } else {
            // Android/Non-iOS 13+ just show instructions
            setShowCalibration(true);
        }
    };

    // Ka'bah Coordinates
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;

    useEffect(() => {
        getLocation();
        startCompass();

        return () => {
            stopCompass();
        };
    }, []);

    const getLocation = async () => {
        try {
            const position = await Geolocation.getCurrentPosition();
            setLocation(position.coords);
            calculateQibla(position.coords.latitude, position.coords.longitude);
            getCityName(position.coords.latitude, position.coords.longitude);
        } catch (e) {
            console.error("Error getting location", e);
            setError("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
            // Fallback to Jakarta
            calculateQibla(-6.2088, 106.8456);
            setCityName("Jakarta (Default)");
        }
    };

    const getCityName = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.county || data.address.state || "Lokasi Tidak Diketahui";
                setCityName(city);
            }
        } catch (error) {
            console.error("Error fetching city name:", error);
            setCityName("Lokasi Terdeteksi");
        }
    };

    const calculateQibla = (lat, lng) => {
        const phiK = KAABA_LAT * Math.PI / 180.0;
        const lambdaK = KAABA_LNG * Math.PI / 180.0;
        const phi = lat * Math.PI / 180.0;
        const lambda = lng * Math.PI / 180.0;

        const psi = 180.0 / Math.PI * Math.atan2(
            Math.sin(lambdaK - lambda),
            Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
        );

        setQiblaDirection(psi);
    };

    const startCompass = async () => {
        try {
            // Check if Motion plugin is available (Native)
            // Or use DeviceOrientation API (Web)
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ requires permission
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stopCompass = () => {
        window.removeEventListener('deviceorientation', handleOrientation);
    };

    const handleOrientation = (event) => {
        let alpha = event.alpha; // Z-axis rotation [0, 360)

        // iOS Webkit Compass Heading
        if (event.webkitCompassHeading) {
            alpha = event.webkitCompassHeading;
        }
        // Android (Chrome) - alpha is counter-clockwise, so we might need to adjust
        // But standard 'alpha' usually works for basic north.
        // Ideally we use 'deviceorientationabsolute' for Android if available.

        // For simplicity in this hybrid app:
        setHeading(alpha);
    };

    // Calculate rotation: We want the arrow to point to Qibla.
    // Arrow points UP (0 deg) by default.
    // If Phone points North (0 deg), Qibla is at `qiblaDirection`.
    // So we rotate arrow by `qiblaDirection`.
    // If Phone points East (90 deg), we need to rotate arrow by `qiblaDirection - 90`.
    // So Rotation = Qibla - Heading.
    const rotation = qiblaDirection - heading;

    return (
        <div id="view-qibla" className="view active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="glass-panel" style={{
                padding: '40px',
                borderRadius: '30px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '85%',
                maxWidth: '350px'
            }}>
                <h2 style={{ marginBottom: '10px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Arah Kiblat</h2>

                <div className="degree-display">{Math.round(qiblaDirection)}°</div>
                <div style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '30px', fontWeight: '600' }}>
                    {cityName ? cityName : (location ? "Mencari nama kota..." : "Mencari GPS...")}
                </div>

                <div className="compass-container" style={{ position: 'relative', width: '260px', height: '260px' }}>
                    {/* Compass Dial (Background) - Rotates with phone to show North */}
                    <div className="compass-dial-premium" style={{
                        transform: `rotate(${-heading}deg)`,
                        transition: 'transform 0.1s ease-out',
                    }}>
                        <div className="compass-ticks"></div>
                        <div style={{ position: 'absolute', top: '15px', fontWeight: 'bold', color: '#EF4444' }}>N</div>
                        <div style={{ position: 'absolute', bottom: '15px', fontWeight: 'bold', opacity: 0.5 }}>S</div>
                        <div style={{ position: 'absolute', right: '15px', fontWeight: 'bold', opacity: 0.5 }}>E</div>
                        <div style={{ position: 'absolute', left: '15px', fontWeight: 'bold', opacity: 0.5 }}>W</div>

                        {/* Kaaba Icon on Dial */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '40px',
                            height: '40px',
                            transform: `translate(-50%, -50%) rotate(${qiblaDirection}deg) translateY(-90px) rotate(${-qiblaDirection}deg)`,
                            zIndex: 5
                        }}>
                            <img
                                src="https://img.icons8.com/color/96/kaaba.png"
                                alt="Kaaba"
                                style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                            />
                        </div>
                    </div>

                    {/* Qibla Arrow - Points to Qibla relative to North */}
                    <div className="qibla-arrow-premium" style={{
                        transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
                        transition: 'transform 0.1s ease-out',
                    }}></div>

                    {/* Center Dot */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '20px',
                        height: '20px',
                        background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 11,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        border: '2px solid #fff'
                    }}></div>
                </div>

                {error && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>{error}</p>}

                <button className="btn-calibration" onClick={handleCalibration}>
                    <i className="fa-solid fa-sync"></i>
                    Kalibrasi Kompas
                </button>
            </div>

            {showCalibration && (
                <div className="calibration-modal" onClick={() => setShowCalibration(false)}>
                    <div className="calibration-content" onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '40px', marginBottom: '20px', color: 'var(--primary)' }}>
                            <i className="fa-solid fa-infinity"></i>
                        </div>
                        <h3 style={{ marginBottom: '10px' }}>Kalibrasi Kompas</h3>
                        <p style={{ marginBottom: '20px', opacity: 0.8 }}>
                            Gerakkan HP Anda membentuk angka 8 di udara untuk meningkatkan akurasi kompas.
                        </p>
                        <button className="btn-primary" onClick={() => setShowCalibration(false)}>
                            Selesai
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
