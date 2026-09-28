import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { api } from '../api';

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await api.admin.login({ username, password });

            // On render, vite API url should fetch. note to self march 24
            if (result && result.success) {
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('isAdmin', 'true');
                navigate('/admin');
            } else {
                setError(result?.error || 'Authentication denied. Check credentials.');
            }
        } catch (err) {
            // 404 falling back to a frontend html page due to missing API URL. nawa o
            if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
                setError('API Unreachable: Missing VITE_API_URL environment variable.');
            } else {
                setError('System offline or unreachable. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="centered-layout animate-fade">
            <div className="card animate-up" style={{ width: '100%', maxWidth: '440px', textAlign: 'center', padding: '3.5rem' }}>
                <div style={{ display: 'inline-flex', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1rem', borderRadius: '20px', marginBottom: '2rem' }}>
                    <ShieldAlert size={40} />
                </div>

                <h2 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Lecturer Login</h2>
                {/* <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
                    Authenticated administrative session required to access the internal management console.
                </p> */}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                            <User size={14} className="text-secondary" />
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lecturer ID</label>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ background: 'var(--bg-main)', border: error ? '1px solid var(--danger)' : '1px solid var(--border-light)' }}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                            <Lock size={14} className="text-secondary" />
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Credential</label>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ background: 'var(--bg-main)', border: error ? '1px solid var(--danger)' : '1px solid var(--border-light)' }}
                            required
                            disabled={loading}
                        />
                        {error && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <ShieldAlert size={14} /> {error}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 800, opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'VERIFYING...' : 'AUTHORIZE SESSION'} <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} className="text-muted" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>System Security Active</span>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
