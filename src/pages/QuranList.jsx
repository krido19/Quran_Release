import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuranList() {
    const [surahs, setSurahs] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all' or 'bookmarks'
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetch('https://api.quran.com/api/v4/chapters?language=en')
            .then(res => res.json())
            .then(data => setSurahs(data.chapters));
    }, []);

    const getBookmarks = () => {
        return JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
    };

    const getVerseBookmarks = () => {
        return JSON.parse(localStorage.getItem('verse_bookmarks') || '[]');
    };

    const filteredSurahs = surahs.filter(surah => {
        const matchesSearch = surah.name_simple.toLowerCase().includes(search.toLowerCase()) ||
            surah.name_arabic.includes(search);

        if (filter === 'bookmarks') {
            const bookmarks = getBookmarks().map(b => parseInt(b));
            const verseBookmarks = getVerseBookmarks();
            const surahIdsWithVerses = verseBookmarks.map(vb => vb.surah_id);

            return matchesSearch && (bookmarks.includes(surah.id) || surahIdsWithVerses.includes(surah.id));
        }
        return matchesSearch;
    });

    const [lastRead, setLastRead] = useState(null);
    const [dailyVerse, setDailyVerse] = useState(null);

    useEffect(() => {
        const savedLastRead = JSON.parse(localStorage.getItem('lastRead'));
        setLastRead(savedLastRead);

        // Daily Verse Logic
        const verses = [
            { text: "Maka sesungguhnya bersama kesulitan ada kemudahan.", ref: "QS Al-Insyirah: 5" },
            { text: "Dan Dia mendapatimu sebagai seorang yang bingung, lalu Dia memberikan petunjuk.", ref: "QS Ad-Duha: 7" },
            { text: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.", ref: "QS Ar-Ra'd: 28" },
            { text: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", ref: "QS Al-Baqarah: 286" },
            { text: "Dan bersabarlah, sesungguhnya Allah bersama orang-orang yang sabar.", ref: "QS Al-Anfal: 46" }
        ];
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setDailyVerse(verses[dayOfYear % verses.length]);
    }, []);

    return (
        <div id="view-quran" className="view active">
            {/* Last Read Widget */}
            {lastRead && (
                <div
                    className="last-read-card"
                    onClick={() => navigate(`/surah/${lastRead.surahId}`, { state: { targetVerse: lastRead.verseKey } })}
                    style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        margin: '20px 20px 10px',
                        padding: '15px',
                        borderRadius: '15px',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                    }}
                >
                    <div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>
                            <i className="fa-solid fa-book-open" style={{ marginRight: '5px' }}></i> Terakhir Dibaca
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{lastRead.surahName}</div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>Ayat {lastRead.verseNumber}</div>
                    </div>
                    <div style={{ fontSize: '24px', opacity: 0.8 }}>
                        <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            )}

            {/* Daily Verse Widget */}
            {dailyVerse && (
                <div
                    className="daily-verse-card"
                    style={{
                        background: 'var(--bg-card)',
                        margin: '10px 20px 20px',
                        padding: '15px',
                        borderRadius: '15px',
                        border: '1px solid var(--border)',
                        textAlign: 'center'
                    }}
                >
                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Inspirasi Harian
                    </div>
                    <div style={{ fontStyle: 'italic', marginBottom: '8px', fontSize: '14px' }}>
                        "{dailyVerse.text}"
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'bold' }}>
                        {dailyVerse.ref}
                    </div>
                </div>
            )}

            <div className="search-bar">
                <i className="fa-solid fa-search"></i>
                <input
                    type="text"
                    placeholder="Search Surah..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="filter-buttons">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === 'bookmarks' ? 'active' : ''}`}
                    onClick={() => setFilter('bookmarks')}
                >
                    Bookmarks
                </button>
            </div>



            <div className="surah-list">
                {filteredSurahs.map(surah => (
                    <div
                        key={surah.id}
                        className="surah-item"
                        onClick={() => navigate(`/surah/${surah.id}`)}
                    >
                        <div className="surah-number">{surah.id}</div>
                        <div className="surah-info">
                            <div className="surah-name-en">{surah.name_simple}</div>
                            <div className="surah-details">{surah.translated_name.name} • {surah.verses_count} Verses</div>
                        </div>
                        <div className="surah-name-ar">{surah.name_arabic}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
