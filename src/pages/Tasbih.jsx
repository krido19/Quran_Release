import { useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function Tasbih() {
    const [count, setCount] = useState(() => {
        return parseInt(localStorage.getItem('tasbihCount') || '0');
    });
    const [target, setTarget] = useState(33);

    useEffect(() => {
        localStorage.setItem('tasbihCount', count.toString());
    }, [count]);

    const handleTap = async () => {
        const newCount = count + 1;
        setCount(newCount);

        // Haptic Feedback
        try {
            if (newCount % target === 0) {
                // Long vibration on target reach
                await Haptics.vibrate({ duration: 500 });
            } else {
                // Light impact on normal tap
                await Haptics.impact({ style: ImpactStyle.Medium });
            }
        } catch (e) {
            // Ignore if haptics not supported (browser)
        }
    };

    const resetCount = async () => {
        if (confirm('Reset hitungan?')) {
            setCount(0);
            try {
                await Haptics.notification({ type: 'success' });
            } catch (e) { }
        }
    };

    return (
        <div className="view active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
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
                    flexDirection: 'column'
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
                        background: 'rgba(255,0,0,0.2)',
                        color: '#ff6b6b',
                        padding: '10px 20px',
                        borderRadius: '20px'
                    }}
                >
                    <i className="fa-solid fa-rotate-right"></i> Reset
                </button>

                <select
                    value={target}
                    onChange={(e) => setTarget(parseInt(e.target.value))}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '10px',
                        borderRadius: '20px'
                    }}
                >
                    <option value="33">Target: 33</option>
                    <option value="99">Target: 99</option>
                    <option value="100">Target: 100</option>
                    <option value="1000000">Tanpa Target</option>
                </select>
            </div>
        </div>
    );
}
