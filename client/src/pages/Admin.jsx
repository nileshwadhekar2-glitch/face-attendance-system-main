import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    History,
    Settings2,
    LogOut,
    Search,
    Download,
    Trash2,
    ShieldCheck,
    CloudOff,
    BookOpen
} from 'lucide-react';
import { api } from '../api';
import UserTable from '../features/admin/UserTable';
import AttendanceLogs from '../features/admin/AttendanceLogs';
import SessionManager from '../features/admin/SessionManager';
import SessionStatsModal from '../features/admin/SessionStatsModal';
import UserDetailModal from '../features/admin/UserDetailModal';
import ClassManager from '../features/admin/ClassManager';

function Admin() {
    const [users, setUsers] = useState([]);
    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [userTotalCount, setUserTotalCount] = useState(0);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);

    const [logs, setLogs] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('logs');
    const [selectedSessionStats, setSelectedSessionStats] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form inputs
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionDuration, setNewSessionDuration] = useState('15');
    const [filterDate, setFilterDate] = useState('');

    // Debounce state for live search
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const navigate = useNavigate();

    // Clear modally elevated states specifically on tab switching to prevent "blooming"
    useEffect(() => {
        setSelectedUser(null);
        setSelectedSessionStats(null);

        if (activeTab === 'classes') setSearchQuery('');
    }, [activeTab]);

    // 10-Minute Timeout Logic
    useEffect(() => {
        let timeoutId;

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            // 10 minutes = 10 * 60 * 1000 = 600,000 ms
            timeoutId = setTimeout(() => {
                localStorage.removeItem('isAdmin');
                alert("Session expired due to inactivity.");
                navigate('/admin-login');
            }, 600000); // 10 minutes
        };

        // Track user interaction
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimeout));

        // Initialize the timeout
        resetTimeout();

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimeout));
        };
    }, [navigate]);

    useEffect(() => {
        fetchActiveSession();
        if (activeTab === 'users') {
            setUserPage(1); // reset to page 1 on new search
            fetchUsers(1, debouncedSearch);
        }
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'sessions') fetchSessionHistory();
    }, [activeTab, debouncedSearch, filterDate]);

    useEffect(() => {
        // Fetch users when the page changes explicitly without search debounce triggering it
        if (activeTab === 'users') {
            fetchUsers(userPage, debouncedSearch);
        }
    }, [userPage]);

    const handleLogout = () => {
        if (window.confirm("Securely sign out of administrative panel?")) {
            localStorage.removeItem('isAdmin');
            navigate('/admin-login');
        }
    };

    const fetchUsers = async (page = 1, search = '') => {
        setIsFetchingUsers(true);
        // Build query string manually since we only need simple params
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        queryParams.append('sort', 'name'); // Always sort alphabetically by default
        queryParams.append('page', page.toString());
        queryParams.append('limit', '10'); // Default per page

        const response = await fetch(`/api/users?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (response.ok) {
            const data = await response.json();
            // Since we updated the backend to return an object: { users, total, page, limit, totalPages }
            if (data && data.users) {
                setUsers(data.users);
                setUserTotalPages(data.totalPages);
                setUserTotalCount(data.total);
            } else if (Array.isArray(data)) {
                // Fallback if backend wasn't restarted
                setUsers(data);
                setUserTotalPages(1);
                setUserTotalCount(data.length);
            }
        } else {
            console.error("Failed to fetch users");
        }
        setIsFetchingUsers(false);
    };

    const fetchLogs = async () => {
        const data = await api.attendance.getLogs(debouncedSearch, null, filterDate);
        const grouped = {};
        data.forEach(log => {
            const key = `${log.session_name || 'N/A'}_${log.matric_no || 'Unknown'}`;
            if (!grouped[key]) {
                grouped[key] = { ...log, in_time: null, out_time: null, in_id: null, out_id: null };
            }
            if (log.type === 'in') {
                grouped[key].in_time = log.timestamp;
                grouped[key].in_id = log.id;
            } else if (log.type === 'out') {
                grouped[key].out_time = log.timestamp;
                grouped[key].out_id = log.id;
            }
        });
        setLogs(Object.values(grouped));
    };

    const fetchActiveSession = async () => {
        const data = await api.sessions.getActive();
        setActiveSession(data);
    };

    const fetchSessionHistory = async () => {
        try {
            const data = await api.sessions.getHistory();
            if (Array.isArray(data)) {
                setSessionHistory(data);
            } else {
                console.error("Invalid session history format:", data);
                setSessionHistory([]);
            }
        } catch (error) {
            console.error("Failed to fetch session history:", error);
            setSessionHistory([]);
        }
    };

    const handleCreateSession = async (type, classId, providedDuration) => {
        if (!newSessionName) {
            alert("Please specify a session name for tracking.");
            return { error: 'Name required' };
        }
        try {
            const finalDuration = providedDuration || parseInt(newSessionDuration) || 15;
            const res = await api.sessions.create(newSessionName, type, finalDuration, classId);
            if (res.error) {
                alert(res.error);
                return res;
            }
            setNewSessionName('');
            await fetchActiveSession();
            if (activeTab === 'sessions') fetchSessionHistory();
            return res;
        } catch (e) {
            console.error(e);
            alert("Failed to initiate session.");
            return { error: e.message };
        }
    };

    const handleToggleSessionType = async (id) => {
        if (!window.confirm("Switch Active Session Mode?")) return;
        const data = await api.sessions.toggleType(id);
        if (data.success) fetchActiveSession();
    };

    const handleEndSession = async (id) => {
        if (!window.confirm("Terminate this session record?")) return;
        await api.sessions.toggleActive(id, false);
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Delete this session record permanently?")) return;
        await api.sessions.delete(id);
        fetchSessionHistory();
    };

    const handleDeleteUser = async (id) => {
        await api.users.delete(id);
        fetchUsers(userPage, debouncedSearch);
    };

    const handleDeleteLog = async (id) => {
        if (!id) return;
        await api.attendance.delete(id);
        fetchLogs();
    };

    const handleDeleteBulk = async () => {
        if (!bulkDate || !window.confirm(`Permanently remove all logs for ${bulkDate}?`)) return;
        await api.attendance.deleteBulk(bulkDate);
        setBulkDate('');
        fetchLogs();
    };

    const handleGetStats = async (sessionId) => {
        const data = await api.sessions.getStats(sessionId);
        setSelectedSessionStats(data);
    };

    const handleExportMatrix = async (sessionName) => {
        try {
            const url = api.attendance.exportMatrixUrl(sessionName);
            await api.attendance.downloadExportBlob(url, `attendance_matrix_${sessionName.replace(/\s+/g, '_')}.xlsx`);
        } catch (error) {
            alert('Failed to export. ' + error.message);
        }
    };

    return (
        <div className="page-container animate-fade" style={{ padding: '4rem 1rem' }}>
            <div className="card" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', padding: '1.5rem 2.5rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '12px' }}>
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1px' }}>Management Console</h2>
                        {activeSession && activeSession.name ? (
                            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <ShieldCheck size={14} className="text-success" />
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>Operational:</span>
                                <span style={{ fontWeight: 700 }}>{activeSession.name}</span>
                                {activeSession.class_code && <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{activeSession.class_code}</span>}
                                {activeSession.type && <span className="text-muted">({activeSession.type.toUpperCase()})</span>}
                            </div>
                        ) : (
                            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <CloudOff size={14} />
                                <span>No active attendance sessions currently monitored.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '0.4rem', borderRadius: '12px', gap: '0.25rem' }}>
                    {[
                        { id: 'logs', label: 'Attendance', icon: <History size={16} /> },
                        { id: 'users', label: 'Database', icon: <Users size={16} /> },
                        { id: 'sessions', label: 'Sessions', icon: <Settings2 size={16} /> },
                        { id: 'classes', label: 'Classes', icon: <BookOpen size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="btn"
                            style={{
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                                padding: '0.6rem 1.25rem'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                    <div style={{ width: '1px', background: 'var(--border-light)', margin: '0.5rem' }} />
                    <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.6rem 1rem' }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="card" style={{ width: '100%', padding: '0', overflow: 'hidden', minHeight: '600px' }}>
                {activeTab === 'logs' && (
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                                <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input placeholder="Search logs live..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 'auto' }} />
                                {filterDate && (
                                    <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => setFilterDate('')}>
                                        Clear Filter
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={async () => {
                                    try {
                                        const params = new URLSearchParams({ search: searchQuery, date: filterDate });
                                        await api.attendance.downloadExportBlob(`${api.attendance.exportUrl}?${params}`, 'attendance.xlsx');
                                    } catch (error) {
                                        alert(error.message);
                                    }
                                }}>
                                    <Download size={16} /> Export Records
                                </button>
                            </div>
                        </div>
                        <AttendanceLogs logs={logs} onDeleteLog={handleDeleteLog} />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input placeholder="Filter live by Name or Matric..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
                            </div>
                            <span className="text-secondary" style={{ fontSize: '0.9rem', marginLeft: 'auto' }}>Total: {userTotalCount} Students</span>
                        </div>
                        <UserTable
                            users={users}
                            isFetching={isFetchingUsers}
                            onDeleteUser={handleDeleteUser}
                            onUserClick={setSelectedUser}
                            currentPage={userPage}
                            totalPages={userTotalPages}
                            onPageChange={(page) => setUserPage(page)}
                        />
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div style={{ padding: '2.5rem' }}>
                        <SessionManager
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            activeSession={activeSession}
                            sessionHistory={sessionHistory.filter(s => s.name.toLowerCase().includes(debouncedSearch.toLowerCase()))}
                            newSessionName={newSessionName}
                            setNewSessionName={setNewSessionName}
                            newSessionDuration={newSessionDuration}
                            setNewSessionDuration={setNewSessionDuration}
                            onCreateSession={handleCreateSession}
                            onToggleSessionType={handleToggleSessionType}
                            onEndSession={handleEndSession}
                            onDeleteSession={handleDeleteSession}
                            onGetStats={handleGetStats}
                            onExportMatrix={handleExportMatrix}
                        />
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div style={{ padding: '2.5rem' }}>
                        <ClassManager
                            debouncedSearch={debouncedSearch}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            <SessionStatsModal stats={selectedSessionStats} onClose={() => setSelectedSessionStats(null)} />
            <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    );
}

export default Admin;

