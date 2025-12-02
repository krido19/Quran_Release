import { useEffect, useState, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { getHijriDate } from '../lib/hijri';

export default function PrayerTimes() {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [countdown, setCountdown] = useState('--:--:--');
    const [locationName, setLocationName] = useState('Locating...');
    // ... (rest of state)

    // ... (existing useEffects)

    // Save data for Android Widget
    useEffect(() => {
        if (prayerTimes && nextPrayer) {
            const saveData = async () => {
                const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                const formattedDate = new Date().toLocaleDateString('id-ID', dateOptions);

                const widgetData = {
                    location: locationName,
                    date: formattedDate,
                    nextPrayerName: nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1),
                    nextPrayerTime: formatTime(nextPrayer.time),
                    Subuh: formatTime(prayerTimes.fajr),
                    Dzuhur: formatTime(prayerTimes.dhuhr),
                    Ashar: formatTime(prayerTimes.asr),
                    Maghrib: formatTime(prayerTimes.maghrib),
                    Isya: formatTime(prayerTimes.isha)
                };

                try {
                    await Preferences.set({
                        key: 'widgetData',
                        value: JSON.stringify(widgetData)
                    });
                    // Trigger widget update (optional, but good if we had a native plugin for it)
                    // For now, the widget updates on its own schedule or when app opens/closes if we added that logic.
                    // But saving to prefs is enough for the widget to read on its next update.
                } catch (e) {
                    console.error("Failed to save widget data", e);
                }
            };
            saveData();
        }
    }, [prayerTimes, nextPrayer, locationName]);

    // ... (rest of component)
    const audioRef = useRef(new Audio());
    const [isPlaying, setIsPlaying] = useState(false);
    const [simulatedTime, setSimulatedTime] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'

    // Settings State: 'sound' | 'notification' | 'off'
    const [adzanSettings, setAdzanSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('adzanSettings');
            return saved ? JSON.parse(saved) : {
                fajr: 'sound',
                sunrise: 'off',
                dhuhr: 'sound',
                asr: 'sound',
                maghrib: 'sound',
                isha: 'sound'
            };
        } catch (e) {
            console.error("Error parsing adzanSettings:", e);
            return {
                fajr: 'sound',
                sunrise: 'off',
                dhuhr: 'sound',
                asr: 'sound',
                maghrib: 'sound',
                isha: 'sound'
            };
        }
    });

    // Audio Sources
    // Using local files (downloaded from GitHub)
    const ADZAN_FAJR = '/audio/adzan-fajr.mp3';
    const ADZAN_NORMAL = '/audio/adzan-normal.mp3';



    const [lastPlayedPrayer, setLastPlayedPrayer] = useState(null);

    useEffect(() => {
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [prayerTimes, simulatedTime, adzanSettings, lastPlayedPrayer]);

    // ... (keep other useEffects)

    useEffect(() => {
        localStorage.setItem('adzanSettings', JSON.stringify(adzanSettings));
        // Reschedule notifications when settings change
        if (prayerTimes) {
            scheduleDailyNotifications(prayerTimes);
        }
    }, [adzanSettings, prayerTimes]);

    const checkLocationPermission = async () => {
        try {
            const status = await Geolocation.checkPermissions();
            setPermissionStatus(status.location);

            if (status.location === 'granted') {
                getCurrentLocation();
            } else {
                // If not granted yet, show default location so UI appears
                fallbackLocation();
            }
        } catch (e) {
            console.log("Error checking permissions (browser?)", e);
            // Fallback to browser API if native fails
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(success, error, { timeout: 10000 });
            } else {
                fallbackLocation();
            }
        }
    };

    const requestLocationPermission = async () => {
        try {
            // Try Capacitor first
            const status = await Geolocation.requestPermissions();
            setPermissionStatus(status.location);
            if (status.location === 'granted') {
                getCurrentLocation();
            } else {
                // If denied/prompt, try forcing a browser prompt via getCurrentPosition
                throw new Error("Permission not granted via Capacitor");
            }
        } catch (e) {
            console.log("Error requesting permissions, trying browser fallback", e);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setPermissionStatus('granted');
                        success(position);
                    },
                    (err) => {
                        console.error(err);
                        alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan di browser.");
                        fallbackLocation();
                    },
                    { timeout: 10000 }
                );
            } else {
                alert("Browser tidak mendukung geolokasi.");
            }
        }
    };

    const getCurrentLocation = async () => {
        try {
            const position = await Geolocation.getCurrentPosition({ timeout: 10000 });
            success(position);
        } catch (e) {
            console.log("Error getting location", e);
            error();
        }
    };

    const success = (position) => {
        const { latitude, longitude } = position.coords;
        calculateTimes(latitude, longitude);
        fetchLocationName(latitude, longitude);
    };

    const error = () => {
        fallbackLocation();
    };

    const fallbackLocation = () => {
        // Jakarta
        calculateTimes(-6.2088, 106.8456);
        setLocationName('Jakarta (Default)');
    };

    const calculateTimes = (lat, lng) => {
        const coordinates = new Coordinates(lat, lng);
        const params = CalculationMethod.MuslimWorldLeague();
        const date = new Date();
        const times = new AdhanPrayerTimes(coordinates, date, params);

        setPrayerTimes(times);
        scheduleDailyNotifications(times);
    };

    const scheduleDailyNotifications = async (times) => {
        try {
            // Cancel existing notifications first to avoid duplicates
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }

            const notificationsToSchedule = [];
            const timeNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
            let idCounter = 1;

            for (const name of timeNames) {
                const time = times[name];
                const setting = adzanSettings[name] || 'sound';

                if (setting === 'off') continue;
                if (time < new Date()) continue; // Skip past times

                const isFajr = name === 'fajr';
                const title = `It's time for ${name} prayer!`;
                const body = isFajr ? "As-salatu Khayrum Minan Naum" : "Hayya 'alas-salah";

                notificationsToSchedule.push({
                    title: title,
                    body: body,
                    id: idCounter++,
                    schedule: { at: time },
                    sound: setting === 'sound' ? (isFajr ? 'adzan_fajr.mp3' : 'adzan_normal.mp3') : undefined,
                    actionTypeId: "",
                    extra: null
                });
            }

            if (notificationsToSchedule.length > 0) {
                await LocalNotifications.schedule({ notifications: notificationsToSchedule });
                console.log("Scheduled native notifications:", notificationsToSchedule.length);
            }
        } catch (e) {
            console.log("Error scheduling native notifications (browser mode?)", e);
        }
    };

    const fetchLocationName = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setLocationName(data.address.city || data.address.town || 'Unknown Location');
        } catch (e) {
            setLocationName('Unknown Location');
        }
    };

    const playAdzan = (prayerName) => {
        const key = prayerName.toLowerCase();
        const setting = adzanSettings[key] || 'sound'; // Default to sound if testing or unknown

        if (setting === 'off') return;

        const isFajr = key === 'fajr';

        // Play Audio only if setting is 'sound'
        // This is for FOREGROUND playback (when app is open)
        if (setting === 'sound') {
            const audioSrc = isFajr ? ADZAN_FAJR : ADZAN_NORMAL;

            if (audioRef.current.src !== window.location.origin + audioSrc) {
                audioRef.current.src = audioSrc;
            }

            audioRef.current.play().catch(e => {
                console.error("Audio play failed:", e);
                // Only alert if user explicitly wanted sound
                alert("Gagal memutar suara. Pastikan file audio sudah terdownload dengan benar.");
            });
            setIsPlaying(true);
        }

        // Web Notification (Foreground)
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`It's time for ${prayerName} prayer!`, {
                body: isFajr ? "As-salatu Khayrum Minan Naum" : "Hayya 'alas-salah",
                icon: "/vite.svg"
            });
        }
    };

    const stopAdzan = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
    };

    const startSimulation = () => {
        // Set simulated time to 10 seconds from now
        const simTime = new Date(Date.now() + 10000);
        setSimulatedTime(simTime);

        // Schedule a native notification for simulation
        try {
            LocalNotifications.schedule({
                notifications: [{
                    title: "Simulasi Adzan",
                    body: "Ini adalah tes notifikasi native.",
                    id: 999,
                    schedule: { at: simTime },
                    sound: null
                }]
            });
        } catch (e) {
            console.log("Native sim failed");
        }
    };

    const toggleSetting = (prayerName) => {
        setAdzanSettings(prev => {
            const current = prev[prayerName];
            let next;
            if (current === 'sound') next = 'notification';
            else if (current === 'notification') next = 'off';
            else next = 'sound';

            return { ...prev, [prayerName]: next };
        });
    };

    const updateCountdown = () => {
        const now = new Date();
        let next = null;

        // Check if date has changed (midnight), reload prayer times
        // Use fajr time to check the date of the current prayer times
        if (prayerTimes && prayerTimes.fajr && prayerTimes.fajr.getDate() !== now.getDate()) {
            // Re-calculate for new date
            // We need to trigger calculateTimes again. 
            // Since we don't have lat/lng stored easily in state (only in closure of success), 
            // we might need to rely on the location check interval or store lat/lng.
            // For now, let's just reload the page or trigger a location check if possible.
            // Simplest: checkLocationPermission() again which calls getCurrentLocation
            checkLocationPermission();
            return;
        }

        // Priority: Simulation
        if (simulatedTime) {
            const diff = simulatedTime - now;
            if (diff <= 0) {
                playAdzan('Simulasi');
                setSimulatedTime(null);
                return;
            }
            next = { name: 'Simulasi (Test)', time: simulatedTime };
        } else {
            if (!prayerTimes) return;

            const timeNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
            let minDiff = Infinity;

            for (const name of timeNames) {
                const time = prayerTimes[name];
                if (time > now) {
                    const diff = time - now;
                    if (diff < minDiff) {
                        minDiff = diff;
                        next = { name, time };
                    }
                }
            }

            // Check if we just passed a prayer time
            for (const name of timeNames) {
                const time = prayerTimes[name];
                const diff = now - time; // Positive if now is after time

                // Trigger if within 5 seconds after the time
                // Using a wider window (5000ms) to ensure we don't miss it due to timer lag
                if (diff >= 0 && diff < 5000) {
                    // Prevent double playing: check if we already played this specific prayer
                    // We use a unique key: name + time string
                    const prayerKey = `${name}-${time.getTime()}`;

                    if (lastPlayedPrayer !== prayerKey && !isPlaying) {
                        playAdzan(name);
                        setLastPlayedPrayer(prayerKey);
                    }
                }
            }

            // If no next prayer today, it's Fajr tomorrow (simplified)
            if (!next) {
                // Approximate tomorrow's Fajr (add 24h to today's Fajr)
                // Ideally we should calculate tomorrow's times, but this is a fallback for display
                next = { name: 'fajr', time: new Date(prayerTimes.fajr.getTime() + 24 * 60 * 60 * 1000) };
            }
        }

        setNextPrayer(next);

        const diff = next.time - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    useEffect(() => {
        checkLocationPermission();

        // Request Notification Permission on load (Web & Native)
        const requestPermissions = async () => {
            if ("Notification" in window) {
                Notification.requestPermission();
            }
            try {
                await LocalNotifications.requestPermissions();
            } catch (e) {
                console.log("Native notifications not available (running in browser?)");
            }
        };
        requestPermissions();
    }, []);

    if (!prayerTimes) return <div className="view active">Loading Prayer Times...</div>;

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div id="view-prayer" className="view active">
            <div className="prayer-card">
                <div className="prayer-header">
                    <div className="location-badge">
                        <i className="fa-solid fa-location-dot"></i>
                        <span>{locationName}</span>
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                        {getHijriDate()}
                    </div>

                    {/* Permission Request UI */}
                    {permissionStatus !== 'granted' && (
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={requestLocationPermission}
                                style={{
                                    background: '#ffc107',
                                    color: 'black',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="fa-solid fa-location-arrow"></i> Aktifkan Lokasi
                            </button>
                        </div>
                    )}

                    <div style={{ marginTop: '5px', marginBottom: '10px' }}>
                        <button
                            onClick={checkLocationPermission}
                            style={{
                                background: '#ffc107',
                                color: 'black',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <i className="fa-solid fa-rotate-right"></i>
                            Refresh Lokasi
                        </button>
                    </div>

                    <div className="label" style={{ marginTop: '10px' }}>Next Prayer</div>
                    <h2>{nextPrayer ? nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1) : '--'}</h2>
                    <div className="countdown">{countdown}</div>
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {!isPlaying ? (
                        <>
                            <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '20px', padding: '5px 15px', fontSize: '14px', width: 'auto', height: 'auto' }} onClick={() => playAdzan('Dhuhr')}>
                                <i className="fa-solid fa-volume-high"></i> Test Adzan
                            </button>
                            <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '20px', padding: '5px 15px', fontSize: '14px', width: 'auto', height: 'auto' }} onClick={() => playAdzan('Fajr')}>
                                <i className="fa-solid fa-moon"></i> Test Shubuh
                            </button>
                            <button className="icon-btn" style={{ background: 'rgba(255,255,0,0.2)', color: 'yellow', borderRadius: '20px', padding: '5px 15px', fontSize: '14px', width: 'auto', height: 'auto' }} onClick={startSimulation}>
                                <i className="fa-solid fa-clock"></i> Simulasi (10s)
                            </button>
                        </>
                    ) : (
                        <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '20px', padding: '5px 15px', fontSize: '14px', width: 'auto', height: 'auto' }} onClick={stopAdzan}>
                            <i className="fa-solid fa-stop"></i> Stop Adzan
                        </button>
                    )}
                </div>
            </div>
            <div className="prayer-times-list">
                {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(name => (
                    <div key={name} className={`prayer-row ${nextPrayer?.name === name ? 'active' : ''}`}>
                        <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>{formatTime(prayerTimes[name])}</span>
                            <button
                                className="icon-btn"
                                onClick={() => toggleSetting(name)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    padding: '5px',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: adzanSettings[name] === 'off' ? 'rgba(255,255,255,0.3)' : 'white'
                                }}
                            >
                                {adzanSettings[name] === 'sound' && <i className="fa-solid fa-volume-high"></i>}
                                {adzanSettings[name] === 'notification' && <i className="fa-solid fa-bell"></i>}
                                {adzanSettings[name] === 'off' && <i className="fa-solid fa-bell-slash"></i>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
