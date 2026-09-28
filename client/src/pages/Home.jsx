import React from 'react';
import { Link } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Settings, ShieldCheck, HelpCircle, CheckCircle, Clock } from 'lucide-react';

function Home() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'fixed', top: '10%', left: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, var(--primary-glow), transparent 70%)', filter: 'blur(100px)', zIndex: -1, opacity: 0.5 }} />
            <div style={{ position: 'fixed', bottom: '0%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3), transparent 70%)', filter: 'blur(100px)', zIndex: -1, opacity: 0.5 }} />

            {/* Hero Section */}
            <main className="responsive-hero-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                <div className="animate-up" style={{ maxWidth: '900px', width: '100%' }}>

                    <div className="project-badge animate-fade">
                        <ScanFace size={18} /> Facial Recognition-Based Attendance System
                    </div>

                    <h1 className="responsive-title" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
                        Effortless Attendance via <br />
                        <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Facial Recognition
                        </span>
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3.5rem', maxWidth: '650px', marginInline: 'auto', lineHeight: 1.6, fontWeight: 500 }}>
                        Secure and automated attendance tracking using advanced facial recognition.
                    </p>

                    <div className="flex-center button-gutter" style={{ marginBottom: '5rem' }}>
                        <Link to="/attendance" className="btn btn-secondary responsive-btn hide-on-mobile" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '50px', background: 'var(--bg-glass-strong)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-light)', textDecoration: 'none', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)' }}>
                            <Camera size={22} /> ENTER SCANNER
                        </Link>
                        <Link to="/register" className="btn btn-primary responsive-btn" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '50px', boxShadow: '0 0 25px var(--primary-glow)', textDecoration: 'none' }}>
                            <UserPlus size={22} /> REGISTER FACE
                        </Link>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left', marginTop: '2rem' }}>
                        <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
                            <div style={{ color: 'var(--primary)', marginBottom: '1.5rem', background: 'var(--bg-glass-strong)', display: 'inline-flex', padding: '1rem', borderRadius: '16px', boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-light)' }}>
                                <Settings size={28} />
                            </div>
                            <h3 style={{ marginBottom: '1rem', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-main)' }}>Fully Automated</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                                Create strictly timed sessions, restrict access by class enrollment, and export comprehensive attendance matrices globally.
                            </p>
                        </div>
                        <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
                            <div style={{ color: 'var(--secondary)', marginBottom: '1.5rem', background: 'var(--bg-glass-strong)', display: 'inline-flex', padding: '1rem', borderRadius: '16px', boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-light)' }}>
                                <ShieldCheck size={28} />
                            </div>
                            <h3 style={{ marginBottom: '1rem', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-main)' }}>Real-Time Processing</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                                Utilizing browser-based neural networks for fast, secure identification without constant web pings.
                            </p>
                        </div>
                    </div>

                    {/* How It Works Section */}
                    <div className="responsive-padding" style={{ marginTop: '5rem', textAlign: 'left', background: 'var(--bg-glass)', borderRadius: '24px', padding: '3rem', border: '1px solid var(--border-light)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(20px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                            <HelpCircle size={32} className="text-primary" />
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>System Instructions</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                            {/* Step 1 */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem', boxShadow: '0 4px 10px var(--primary-glow)' }}>
                                    1
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserPlus size={18} /> First-Time Enrollment
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        Before you can mark attendance, navigate to the <strong style={{ color: 'var(--text-main)' }}>Register Face</strong> portal. Enter your academic details and follow the on-screen prompts to capture your facial biometric data. Note: The system will require you to hold still without glasses and take two captures for accuracy.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'var(--secondary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(236,72,153,0.3)' }}>
                                    2
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={18} /> Wait for a Session
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        Attendance can only be marked when a Lecturer has opened an active session for your enrolled class. If no session is active, or if the time limit expires, the scanner will lock you out.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'var(--success)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem', boxShadow: '0 4px 10px var(--success-bg)' }}>
                                    3
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle size={18} /> Scan at Class Terminal
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        Once the lecturer launches the session on the main classroom terminal, approach the webcam. Look directly into the camera until the bounding box identifies your face and a success notification appears on screen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', marginTop: 'auto', fontWeight: 500 }}>
                &copy; 2026 Facial Recognition-Based Attendance System
            </footer>
        </div>
    );
}

export default Home;
