import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await signIn(email, password);
        if (error) {
            alert(error.message); // Replace with Toast later
        } else {
            navigate('/');
        }
    };

    if (user) {
        return (
            <div id="view-login" className="view active">
                <div className="auth-container">
                    <h2>My Profile</h2>
                    <p>{user.email}</p>

                    <div className="bookmarks-section" style={{ marginTop: '30px', textAlign: 'left', width: '100%' }}>
                        <h3>Saved Bookmarks</h3>
                        <BookmarksList />
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => signOut()}
                        style={{ background: 'var(--text-muted)', marginTop: '20px' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id="view-login" className="view active">
            <div className="auth-container">
                <h2>Welcome Back</h2>
                <p>Sign in to sync your bookmarks</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Sign In</button>
                </form>
                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

function BookmarksList() {
    const [surahBookmarks, setSurahBookmarks] = useState([]);
    const [verseBookmarks, setVerseBookmarks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const surahs = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        const verses = JSON.parse(localStorage.getItem('verse_bookmarks') || '[]');
        setSurahBookmarks(surahs);
        setVerseBookmarks(verses);
    }, []);

    if (surahBookmarks.length === 0 && verseBookmarks.length === 0) {
        return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No bookmarks yet.</p>;
    }

    return (
        <div className="bookmarks-list">
            {surahBookmarks.length > 0 && (
                <div className="bookmark-group">
                    <h4>Surahs</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {surahBookmarks.map(id => (
                            <button
                                key={id}
                                onClick={() => navigate(`/surah/${id}`)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '8px 15px',
                                    borderRadius: '20px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Surah {id}
                                import {useState, useEffect} from 'react';
                                import {useAuth} from '../context/AuthContext';
                                import {useNavigate, Link} from 'react-router-dom';

                                export default function Login() {
    const [email, setEmail] = useState('');
                                const [password, setPassword] = useState('');
                                const {signIn, user, signOut} = useAuth();
                                const navigate = useNavigate();

    const handleSubmit = async (e) => {
                                    e.preventDefault();
                                const {error} = await signIn(email, password);
                                if (error) {
                                    alert(error.message); // Replace with Toast later
        } else {
                                    navigate('/');
        }
    };

                                if (user) {
        return (
                                <div id="view-login" className="view active">
                                    <div className="auth-container">
                                        <h2>My Profile</h2>
                                        <p>{user.email}</p>

                                        <div className="bookmarks-section" style={{ marginTop: '30px', textAlign: 'left', width: '100%' }}>
                                            <h3>Saved Bookmarks</h3>
                                            <BookmarksList />
                                        </div>

                                        <button
                                            className="btn-primary"
                                            onClick={() => signOut()}
                                            style={{ background: 'var(--text-muted)', marginTop: '20px' }}
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                                );
    }

                                return (
                                <div id="view-login" className="view active">
                                    <div className="auth-container">
                                        <h2>Welcome Back</h2>
                                        <p>Sign in to sync your bookmarks</p>
                                        <form onSubmit={handleSubmit}>
                                            <div className="form-group">
                                                <label>Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="name@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </div>
                                            <button type="submit" className="btn-primary">Sign In</button>
                                        </form>
                                        <p className="auth-footer">
                                            Don't have an account? <Link to="/signup">Sign Up</Link>
                                        </p>
                                    </div>
                                </div>
                                );
}

                                function BookmarksList() {
    const [surahBookmarks, setSurahBookmarks] = useState([]);
                                const [verseBookmarks, setVerseBookmarks] = useState([]);
                                const navigate = useNavigate();

    useEffect(() => {
        const surahs = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
                                const verses = JSON.parse(localStorage.getItem('verse_bookmarks') || '[]');
                                setSurahBookmarks(surahs);
                                setVerseBookmarks(verses);
    }, []);

                                if (surahBookmarks.length === 0 && verseBookmarks.length === 0) {
        return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No bookmarks yet.</p>;
    }

                                return (
                                <div className="bookmarks-list">
                                    {surahBookmarks.length > 0 && (
                                        <div className="bookmark-group">
                                            <h4>Surahs</h4>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {surahBookmarks.map(id => (
                                                    <button
                                                        key={id}
                                                        onClick={() => navigate(`/surah/${id}`)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            padding: '8px 15px',
                                                            borderRadius: '20px',
                                                            color: 'white',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Surah {id}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {verseBookmarks.length > 0 && (
                                        <div className="bookmark-group" style={{ marginTop: '20px' }}>
                                            <h4>Verses</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {verseBookmarks.map((b, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => navigate(`/surah/${b.surah_id}`, { state: { targetVerse: b.verse_key } })}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)',
                                                            padding: '10px',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            borderLeft: '3px solid var(--primary-color)'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>QS {b.surah_name} {b.verse_key.split(':')[1]}</div>
                                                        <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>{b.translation?.substring(0, 50)}...</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
}
