import { useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function Tasbih() {
    const [count, setCount] = useState(() => {
        return parseInt(localStorage.getItem('tasbihCount') || '0');
    });
    const [target, setTarget] = useState(33);
    const [showModal, setShowModal] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('tasbihSound') === 'true';
    });
    const [history, setHistory] = useState(() => {
        return JSON.parse(localStorage.getItem('tasbihHistory') || '[]');
    });
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        localStorage.setItem('tasbihCount', count.toString());
    }, [count]);

    useEffect(() => {
        localStorage.setItem('tasbihSound', soundEnabled);
    }, [soundEnabled]);

    useEffect(() => {
        localStorage.setItem('tasbihHistory', JSON.stringify(history));
    }, [history]);

    // Volume Button Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'VolumeUp' || e.key === 'VolumeDown') {
                handleTap();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [count, target, soundEnabled]); // Dependencies needed for handleTap closure

    const playSound = () => {
        if (soundEnabled) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Short click sound
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio play failed", e));
        }
    };

    const handleTap = async () => {
        const newCount = count + 1;
        setCount(newCount);
        playSound();

        // Haptic Feedback
        try {
            if (target > 0 && newCount % target === 0) {
                // Long vibration on target reach
                await Haptics.vibrate({ duration: 500 });
                setShowModal(true);
            } else {
                // Light impact on normal tap
                await Haptics.impact({ style: ImpactStyle.Medium });
            }
        } catch (e) {
            // Ignore if haptics not supported (browser)
        }
    };

    const saveHistory = () => {
        if (count > 0) {
            const newEntry = {
                id: Date.now(),
                date: new Date().toLocaleString('id-ID'),
                count: count,
                target: target
            };
            setHistory([newEntry, ...history]);
        }
    };

    const resetCount = async () => {
        if (confirm('Reset hitungan?')) {
            saveHistory();
            setCount(0);
            setShowModal(false);
            try {
                await Haptics.notification({ type: 'success' });
            } catch (e) { }
        }
    };

    const handleResetFromModal = async () => {
        saveHistory();
        setCount(0);
        setShowModal(false);
        try {
            await Haptics.notification({ type: 'success' });
        } catch (e) { }
    };

    const clearHistory = () => {
        if (confirm('Hapus semua riwayat?')) {
            setHistory([]);
        }
    };

    return (
        <div className="view active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', position: 'absolute', top: '20px' }}>
                <button
                    className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                >
                    <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                </button>
                <button
                    className="sound-toggle"
                    onClick={() => setShowHistory(true)}
                >
                    <i className="fa-solid fa-clock-rotate-left"></i>
                </button>
            </div>

            <h2 style={{ marginBottom: '20px' }}>Tasbih Digital</h2>

            <div className="tasbih-display" style={{
                fontSize: '80px',
                fontWeight: 'bold',
                marginBottom: '30px',
                fontFamily: 'monospace'
            }}>
                {count}
            </div>

            <button
                onClick={handleTap}
                className="tasbih-btn"
                style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'linear-gradient(145deg, #1e1e1e, #2a2a2a)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    transition: 'transform 0.1s'
                }}
            >
                <i className="fa-solid fa-fingerprint" style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.7 }}></i>
                <span>Tap</span>
            </button>

            <div className="controls" style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                <button
                    onClick={resetCount}
                    className="icon-btn"
                    style={{
                        background: 'rgba(255, 0, 0, 0.1)',
                        color: '#ef4444',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 0, 0, 0.2)'
                    }}
                >
                    <i className="fa-solid fa-rotate-right"></i> Reset
                </button>

                <select
                    value={target}
                    onChange={(e) => setTarget(parseInt(e.target.value))}
                    style={{
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--text-muted)',
                        padding: '10px',
                        borderRadius: '20px',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="33">Target: 33</option>
                    <option value="99">Target: 99</option>
                    <option value="100">Target: 100</option>
                    <option value="1000000">Tanpa Target</option>
                </select>
            </div>

            {showModal && (
                <div className="tasbih-modal">
                    <div className="tasbih-modal-content">
                        <div style={{ fontSize: '50px', color: 'var(--primary)', marginBottom: '10px' }}>
                            <i className="fa-solid fa-circle-check"></i>
                        </div>
                        <h3 style={{ margin: 0 }}>Target Tercapai!</h3>
                        <p style={{ margin: 0, opacity: 0.8 }}>Anda telah mencapai {target} hitungan.</p>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button className="tasbih-modal-btn secondary" onClick={handleResetFromModal}>
                                Reset
                            </button>
                            <button className="tasbih-modal-btn primary" onClick={() => setShowModal(false)}>
                                Lanjut
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className="tasbih-modal" onClick={() => setShowHistory(false)}>
                    <div className="tasbih-modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: 0, marginBottom: '10px' }}>Riwayat Dzikir</h3>

                        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '15px', textAlign: 'left', background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '10px' }}>
                            <strong>Cara Menyimpan:</strong><br />
                            Setiap kali Anda menekan tombol <b>Reset</b> (atau Reset pada popup Target), hitungan terakhir akan otomatis tersimpan di sini.
                        </div>

                        {history.length === 0 ? (
                            <p style={{ opacity: 0.6 }}>Belum ada riwayat.</p>
                        ) : (
                            <div className="tasbih-history-list">
                                {history.map(item => (
                                    <div key={item.id} className="history-item">
                                        <span className="history-date">{item.date}</span>
                                        <span className="history-count">{item.count}x</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button className="tasbih-modal-btn secondary" onClick={clearHistory} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                                Hapus Semua
                            </button>
                            <button className="tasbih-modal-btn primary" onClick={() => setShowHistory(false)}>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
