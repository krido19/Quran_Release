import { Link } from 'react-router-dom';

export default function Menu() {
    const menuItems = [
        { path: '/asmaul-husna', icon: 'fa-solid fa-star-and-crescent', label: 'Asmaul Husna', color: '#FFD700' },
        { path: '/daily-prayers', icon: 'fa-solid fa-hands-praying', label: 'Doa Harian', color: '#4CAF50' },
        { path: '/prayer', icon: 'fa-solid fa-clock', label: 'Jadwal Sholat', color: '#2196F3' },
        { path: '/profile', icon: 'fa-solid fa-user', label: 'Profil Saya', color: '#9C27B0' },
    ];

    return (
        <div className="view active" style={{ padding: '20px', paddingBottom: '80px' }}>
            <h1 style={{ marginBottom: '20px' }}>Menu Lainnya</h1>

            <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {menuItems.map((item, index) => (
                    <Link to={item.path} key={index} style={{
                        textDecoration: 'none',
                        color: 'var(--text-main)',
                        background: 'var(--bg-card)',
                        padding: '20px',
                        borderRadius: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            fontSize: '30px',
                            color: item.color,
                            marginBottom: '5px'
                        }}>
                            <i className={item.icon}></i>
                        </div>
                        <span style={{ fontWeight: '600' }}>{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
