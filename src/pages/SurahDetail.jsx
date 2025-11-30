import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toBlob } from 'html-to-image';

export default function SurahDetail() {
    const [shareVerseData, setShareVerseData] = useState(null);
    const shareCardRef = useRef(null);

    const shareVerse = (verse) => {
        // Try to get Indonesian translation (33), fallback to English (131)
        const translationObj = verse.translations.find(t => t.resource_id === 33) ||
            verse.translations.find(t => t.resource_id === 131);
        const translation = translationObj ? translationObj.text.replace(/<[^>]*>?/gm, '') : '';

        setShareVerseData({
            surahName: surah.name_simple,
            verseNumber: verse.verse_key.split(':')[1],
            arabic: verse.text_uthmani,
            translation: translation
        });
    };

    const handleShareImage = async () => {
        if (shareCardRef.current) {
            try {
                const blob = await toBlob(shareCardRef.current, { cacheBust: true });
                const file = new File([blob], `verse-${shareVerseData.surahName}-${shareVerseData.verseNumber}.png`, { type: 'image/png' });

                if (navigator.share) {
                    await navigator.share({
                        files: [file],
                        title: 'Share Verse',
                        text: 'Shared from Islamic App'
                    });
                } else {
                    // Fallback download
                    const link = document.createElement('a');
                    link.download = `verse-${shareVerseData.surahName}-${shareVerseData.verseNumber}.png`;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }
            } catch (err) {
                console.error('Error sharing image:', err);
                alert('Gagal membuat gambar. Coba lagi.');
            }
        }
    };
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [surah, setSurah] = useState(null);
    const [verses, setVerses] = useState([]);
    const [audioSrc, setAudioSrc] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
    const audioRef = useRef(new Audio());
    const verseRefs = useRef([]);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const viewRef = useRef(null);

    // Fetch Surah Info
    useEffect(() => {
        fetch(`https://api.quran.com/api/v4/chapters/${id}?language=en`)
            .then(res => res.json())
            .then(data => {
                setSurah(data.chapter);
                // Reset verses when surah changes
                setVerses([]);
                setPage(1);
                setHasMore(true);
                fetchVerses(1);
            });
    }, [id]);

    // Auto-scroll to target verse if provided
    useEffect(() => {
        if (location.state?.targetVerse && verses.length > 0) {
            const targetKey = location.state.targetVerse;
            const index = verses.findIndex(v => v.verse_key === targetKey);
            if (index !== -1) {
                // Small delay to ensure rendering
                setTimeout(() => {
                    scrollToVerse(index);
                    // Clear state to prevent re-scrolling
                    window.history.replaceState({}, document.title);
                }, 500);
            }
        }
    }, [verses, location.state]);

    // Fetch Verses with Pagination
    const fetchVerses = (pageNumber) => {
        if (isLoading) return;
        setIsLoading(true);

        fetch(`https://api.quran.com/api/v4/verses/by_chapter/${id}?language=en&words=true&translations=131,33,57&audio=1&fields=text_uthmani,text_indopak&per_page=10&page=${pageNumber}`)
            .then(res => res.json())
            .then(data => {
                if (data.verses.length === 0) {
                    setHasMore(false);
                } else {
                    setVerses(prev => {
                        // Avoid duplicates
                        const newVerses = data.verses.filter(v => !prev.some(p => p.id === v.id));
                        return [...prev, ...newVerses];
                    });
                    if (pageNumber === 1 && data.verses.length > 0) {
                        setAudioSrc(data.verses[0].audio.url);
                    }
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    // Infinite Scroll with IntersectionObserver
    const observer = useRef();
    const lastVerseElementRef = (node) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    };

    // Trigger fetch when page changes
    useEffect(() => {
        if (page > 1) {
            fetchVerses(page);
        }
    }, [page]);

    // Audio Logic
    useEffect(() => {
        const audio = audioRef.current;

        const handleEnded = () => {
            if (currentVerseIndex < verses.length - 1) {
                playVerse(currentVerseIndex + 1);
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [verses, currentVerseIndex]);

    const playVerse = (index) => {
        if (index >= 0 && index < verses.length) {
            setCurrentVerseIndex(index);
            const url = verses[index].audio.url;
            if (url) {
                audioRef.current.src = `https://verses.quran.com/${url}`;
                audioRef.current.play();
                setIsPlaying(true);
                scrollToVerse(index);
            }
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (audioRef.current.src) {
                audioRef.current.play();
                setIsPlaying(true);
            } else {
                playVerse(currentVerseIndex);
            }
        }
    };

    const scrollToVerse = (index) => {
        if (verseRefs.current[index]) {
            verseRefs.current[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Save Last Read
    useEffect(() => {
        if (surah && verses.length > 0 && verses[currentVerseIndex]) {
            const lastReadData = {
                surahId: surah.id,
                surahName: surah.name_simple,
                verseNumber: verses[currentVerseIndex].verse_key.split(':')[1],
                verseKey: verses[currentVerseIndex].verse_key,
                timestamp: Date.now()
            };
            localStorage.setItem('lastRead', JSON.stringify(lastReadData));
        }
    }, [surah, verses, currentVerseIndex]);

    const [isSurahBookmarked, setIsSurahBookmarked] = useState(false);

    useEffect(() => {
        const bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        setIsSurahBookmarked(bookmarks.includes(parseInt(id)));
    }, [id]);

    const toggleBookmark = () => {
        let bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        const surahId = parseInt(id);

        // Ensure all are numbers
        bookmarks = bookmarks.map(b => parseInt(b));

        let newBookmarks;

        if (bookmarks.includes(surahId)) {
            newBookmarks = bookmarks.filter(b => b !== surahId);
            setIsSurahBookmarked(false);
            // alert('Bookmark Surah dihapus');
        } else {
            newBookmarks = [...bookmarks, surahId];
            setIsSurahBookmarked(true);
            // alert('Surah berhasil disimpan');
        }
        localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
    };

    // Verse Bookmark Logic
    const [bookmarkedVerses, setBookmarkedVerses] = useState([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('verse_bookmarks') || '[]');
        setBookmarkedVerses(saved);
    }, []);

    const toggleVerseBookmark = (verse) => {
        const saved = JSON.parse(localStorage.getItem('verse_bookmarks') || '[]');
        const isBookmarked = saved.some(b => b.verse_key === verse.verse_key);
        let newBookmarks;

        if (isBookmarked) {
            newBookmarks = saved.filter(b => b.verse_key !== verse.verse_key);
            // alert('Bookmark Ayat dihapus');
        } else {
            const translation = verse.translations.find(t => t.resource_id === 131)?.text.replace(/<[^>]*>?/gm, '');
            const bookmarkData = {
                verse_key: verse.verse_key,
                text_uthmani: verse.text_uthmani,
                translation: translation,
                surah_name: surah.name_simple,
                surah_id: surah.id
            };
            newBookmarks = [...saved, bookmarkData];
            // alert('Ayat berhasil disimpan');
        }
        setBookmarkedVerses(newBookmarks);
        localStorage.setItem('verse_bookmarks', JSON.stringify(newBookmarks));
    };

    const handleVersePlay = (index) => {
        if (currentVerseIndex === index && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            playVerse(index);
        }
    };

    if (!surah) return <div className="view active">Loading...</div>;

    return (
        <div id="view-surah-detail" className="view active" ref={viewRef}>
            <div className="detail-header">
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h2>{surah.name_simple}</h2>
                <div className="detail-actions">
                    <button className="icon-btn" onClick={toggleBookmark}>
                        <i className={`fa-${isSurahBookmarked ? 'solid' : 'regular'} fa-bookmark`}></i>
                    </button>
                </div>
            </div>

            <div className="audio-player-container">
                <div className="audio-controls">
                    <button className="icon-btn" onClick={() => playVerse(currentVerseIndex - 1)}>
                        <i className="fa-solid fa-backward-step"></i>
                    </button>
                    <button className="icon-btn play-btn" onClick={togglePlay}>
                        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>
                    <button className="icon-btn" onClick={() => playVerse(currentVerseIndex + 1)}>
                        <i className="fa-solid fa-forward-step"></i>
                    </button>
                </div>
                <div className="audio-info">
                    <span>Verse {currentVerseIndex + 1}</span>
                </div>
            </div>

            <div className="verses-list">
                {verses.map((verse, index) => {
                    const translationEn = verse.translations.find(t => t.resource_id === 131)?.text;
                    const translationId = verse.translations.find(t => t.resource_id === 33)?.text;
                    const transliteration = verse.translations.find(t => t.resource_id === 57)?.text;
                    const isBookmarked = bookmarkedVerses.some(b => b.verse_key === verse.verse_key);

                    // Attach ref to the last element
                    if (verses.length === index + 1) {
                        return (
                            <div
                                key={verse.id}
                                ref={lastVerseElementRef}
                                className={`verse-item ${index === currentVerseIndex ? 'active' : ''}`}
                            >
                                <div className="verse-header">
                                    <span className="verse-number">{surah.id}:{verse.verse_key.split(':')[1]}</span>
                                    <div className="verse-actions">
                                        <button
                                            className="icon-btn"
                                            onClick={(e) => { e.stopPropagation(); handleVersePlay(index); }}
                                            title={currentVerseIndex === index && isPlaying ? "Pause" : "Play"}
                                        >
                                            <i className={`fa-solid ${currentVerseIndex === index && isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                                        </button>
                                        <button
                                            className="icon-btn"
                                            onClick={(e) => { e.stopPropagation(); toggleVerseBookmark(verse); }}
                                            title="Bookmark Verse"
                                        >
                                            <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark`}></i>
                                        </button>
                                        <button
                                            className="icon-btn"
                                            onClick={(e) => { e.stopPropagation(); shareVerse(verse); }}
                                            title="Share Verse"
                                        >
                                            <i className="fa-regular fa-share-from-square"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="verse-arabic">{verse.text_uthmani}</div>
                                <div className="verse-transliteration">{transliteration}</div>
                                <div className="verse-translation-group">
                                    <div className="verse-translation-id">{translationId}</div>
                                    <div className="verse-translation-en">{translationEn?.replace(/<[^>]*>?/gm, '')}</div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={verse.id}
                            ref={el => verseRefs.current[index] = el}
                            className={`verse-item ${index === currentVerseIndex ? 'active' : ''}`}
                        >
                            <div className="verse-header">
                                <span className="verse-number">{surah.id}:{verse.verse_key.split(':')[1]}</span>
                                <div className="verse-actions">
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => { e.stopPropagation(); handleVersePlay(index); }}
                                        title={currentVerseIndex === index && isPlaying ? "Pause" : "Play"}
                                    >
                                        <i className={`fa-solid ${currentVerseIndex === index && isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => { e.stopPropagation(); toggleVerseBookmark(verse); }}
                                        title="Bookmark Verse"
                                    >
                                        <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark`}></i>
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => { e.stopPropagation(); shareVerse(verse); }}
                                        title="Share Verse"
                                    >
                                        <i className="fa-regular fa-share-from-square"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="verse-arabic">{verse.text_uthmani}</div>
                            <div className="verse-transliteration">{transliteration}</div>
                            <div className="verse-translation-group">
                                <div className="verse-translation-id">{translationId}</div>
                                <div className="verse-translation-en">{translationEn?.replace(/<[^>]*>?/gm, '')}</div>
                            </div>
                        </div>
                    );
                })}
                {isLoading && <div className="loading-more" style={{ textAlign: 'center', padding: '20px' }}>Loading more verses...</div>}
            </div>
            {shareVerseData && (
                <div className="tasbih-modal" onClick={() => setShareVerseData(null)}>
                    <div className="tasbih-modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', padding: '20px' }}>
                        <h3 style={{ marginBottom: '15px' }}>Bagikan Ayat</h3>

                        {/* Card Preview */}
                        <div
                            ref={shareCardRef}
                            style={{
                                background: 'linear-gradient(135deg, #1e1e1e, #2d3748)',
                                padding: '30px 20px',
                                borderRadius: '15px',
                                color: 'white',
                                textAlign: 'center',
                                marginBottom: '20px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Decorative Elements */}
                            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255,215,0,0.1)', borderRadius: '50%' }}></div>
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '50%' }}></div>

                            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                QS {shareVerseData.surahName} : {shareVerseData.verseNumber}
                            </div>
                            <div style={{ fontSize: '24px', fontFamily: 'Amiri, serif', marginBottom: '20px', lineHeight: '1.8' }}>
                                {shareVerseData.arabic}
                            </div>
                            <div style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.9, lineHeight: '1.5' }}>
                                "{shareVerseData.translation}"
                            </div>
                            <div style={{ marginTop: '20px', fontSize: '10px', opacity: 0.5 }}>
                                Islamic App
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="tasbih-modal-btn secondary" onClick={() => setShareVerseData(null)}>
                                Batal
                            </button>
                            <button className="tasbih-modal-btn primary" onClick={handleShareImage}>
                                <i className="fa-solid fa-share-nodes" style={{ marginRight: '8px' }}></i>
                                Bagikan Gambar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
