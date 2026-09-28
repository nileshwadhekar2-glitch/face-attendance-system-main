import React, { useState, useEffect } from 'react';
import {
    PlayCircle,
    StopCircle,
    RefreshCcw,
    Calendar,
    Trash2,
    Activity,
    Info,
    ChevronRight,
    LogIn,
    LogOut,
    BookOpen,
    Search
} from 'lucide-react';
import { api } from '../../api';

function SessionManager({
    activeSession,
    sessionHistory,
    newSessionName,
    setNewSessionName,
    newSessionDuration,
    setNewSessionDuration,
    onCreateSession,
    onToggleSessionType,
    onEndSession,
    onDeleteSession,
    onGetStats,
    onExportMatrix,
    searchQuery,
    setSearchQuery
}) {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await api.classes.getAll();
                if (Array.isArray(data)) {
                    setClasses(data);
                } else {
                    setClasses([]);
                }
            } catch (error) {
                console.error("Failed to fetch classes:", error);
            }
        };
        fetchClasses();
    }, []);

    const [isCreating, setIsCreating] = useState(false);

    const handleExportMatrix = async (sessionName) => {
        try {
            const url = api.attendance.exportMatrixUrl(sessionName);
            await api.attendance.downloadExportBlob(url, `attendance_matrix_${sessionName.replace(/\s+/g, '_')}.xlsx`);
        } catch (error) {
            alert('Failed to export. ' + error.message);
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);

        // Clamp duration between 1 and 60 explicitly, default to 15 if missing/invalid
        let durationVal = parseInt(newSessionDuration);
        if (isNaN(durationVal) || durationVal <= 0) {
            durationVal = 15;
            setNewSessionDuration('15');
        } else if (durationVal > 60) {
            durationVal = 60;
            setNewSessionDuration('60');
        }

        await onCreateSession('in', selectedClass, durationVal);
        setIsCreating(false);
    };

    return (
        <div className="animate-fade" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', marginBottom: '4rem' }}>
                {/* creating my session card */}
                <div className="card" style={{ borderTop: '5px solid var(--primary)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PlayCircle className="text-primary" size={24} />
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Initiate Attendance</h3>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Class Context (Optional)</label>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            style={{ background: 'var(--bg-main)', width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                        >
                            <option value="">-- General Session --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Session Name</label>
                            <input
                                placeholder="e.g. Week 5 Lecture"
                                value={newSessionName}
                                onChange={e => setNewSessionName(e.target.value)}
                                style={{ background: 'var(--bg-main)' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Duration (Min)</label>
                            <input
                                type="number"
                                placeholder="15"
                                min="1"
                                max="60"
                                value={newSessionDuration}
                                onChange={e => setNewSessionDuration(e.target.value)}
                                style={{ background: 'var(--bg-main)' }}
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ padding: '1rem', fontSize: '1rem', opacity: isCreating ? 0.7 : 1 }}
                        onClick={handleCreate}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <><RefreshCcw className="spin" size={18} /> INITIALIZING...</>
                        ) : (
                            <><LogIn size={18} /> INITIALIZE SESSION</>
                        )}
                    </button>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            New sessions automatically finalize any active biometric surveillance.
                        </p>
                    </div>
                </div>

                {/* Active Session Card */}
                <div className="card" style={{
                    borderTop: activeSession ? '5px solid var(--success)' : '5px solid var(--text-muted)',
                    background: activeSession ? 'var(--success-bg)' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '2.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                        <Activity className={activeSession ? 'text-success' : 'text-muted'} size={24} />
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>System Status</h3>
                    </div>

                    {activeSession ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>{activeSession.name}</div>
                            {activeSession.class_code && (
                                <div style={{ marginBottom: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {activeSession.class_code}
                                </div>
                            )}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--success)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '2rem', textTransform: 'uppercase' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }}></div>
                                {activeSession.type === 'in' ? 'Tracking' : 'Monitoring'} ACTIVE
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-danger" onClick={() => onEndSession(activeSession.id)} style={{ flex: 1, padding: '1rem', fontWeight: 700 }}>
                                    <StopCircle size={18} /> TERMINATE SESSION
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <StopCircle size={48} style={{ opacity: 0.1 }} />
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>SENSORS IDLE</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar className="text-secondary" size={20} />
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Audit Archives</h3>
                </div>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px', marginLeft: 'auto' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input placeholder="Filter live by Session Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
                </div>
                <div style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                    HISTORY
                </div>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>IDENTIFIER</th>
                            <th>CLASS</th>
                            <th>TIMESTAMP (START)</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const totalPages = Math.ceil(sessionHistory.length / itemsPerPage) || 1;
                            const paginatedHistory = sessionHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                            if (sessionHistory.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                                            <div style={{ fontWeight: 500 }}>Sessions repository is empty.</div>
                                        </td>
                                    </tr>
                                );
                            }

                            return <>
                                {paginatedHistory.map((hist, index) => (
                                    <tr key={hist.id} onClick={() => onGetStats(hist.id)} className="clickable animate-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                        <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <ChevronRight size={14} className="text-primary" />
                                                {hist.name}
                                            </div>
                                        </td>
                                        <td>
                                            {hist.class_code ? <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{hist.class_code}</span> : <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>GENERAL</span>}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>{new Date(hist.start_time).toLocaleString()}</td>
                                        <td>
                                            {hist.is_active ?
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 800, fontSize: '0.7rem' }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} /> LIVE
                                                </div> :
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.7rem' }}>
                                                    ARCHIVED
                                                </div>
                                            }
                                        </td>
                                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onExportMatrix(hist.name); }}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                title="Export Matrix"
                                            >
                                                <LogIn size={14} /> EXPORT
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteSession(hist.id); }}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem', color: 'var(--danger)' }}
                                                title="Purge record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {totalPages > 1 && (
                                    <tr>
                                        <td colSpan="6">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sessionHistory.length)} of {sessionHistory.length} entries
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Prev</button>
                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '30px', fontWeight: 600, fontSize: '0.9rem' }}>{currentPage} / {totalPages}</span>
                                                    <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Next</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>;
                        })()}
                    </tbody>
                </table>
            </div>
        </div >
    );
}

export default SessionManager;
