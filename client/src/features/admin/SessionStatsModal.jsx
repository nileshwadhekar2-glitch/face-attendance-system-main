import React from 'react';
import { BarChart3, Users, LogIn, LogOut, X } from 'lucide-react';

function SessionStatsModal({ stats, onClose }) {
    if (!stats) return null;

    return (
        <div className="modal-overlay animate-fade" onClick={onClose} style={{ backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}>
            <div className="modal-content animate-up" onClick={e => e.stopPropagation()} style={{ padding: '2.5rem', maxWidth: '450px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart3 className="text-primary" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Session Analytics</h2>
                    </div>
                    <button onClick={onClose} className="btn" style={{ padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--bg-main)', border: 'none', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
                            <Users size={32} />
                        </div>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{stats.total_students}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '1px' }}>Captured Students</div>
                    </div>

                    <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', color: '#166534', marginBottom: '0.5rem' }}>
                            <LogIn size={24} />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#166534' }}>{stats.total_in}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>Verified Attendance</div>
                    </div>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                    <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 800 }}>
                        CLOSE ANALYTICS
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionStatsModal;
