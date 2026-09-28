import React, { useEffect, useRef, useState } from 'react';
import { UserCheck, Camera, Info, AlertCircle, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api';
import * as faceapi from 'face-api.js';

const courseToDepartmentMap = {
    "Computer Science": "Computer Science",
    "Software Engineering": "Software Engineering",
    "Information Technology": "Information Technology",
    "Computer Engineering": "Engineering",
    "Civil Engineering": "Engineering",
    "Electrical & Electronics Engineering": "Engineering",
    "Mechanical Engineering": "Engineering",
    "Accounting": "Accounting",
    "Banking & Finance": "Banking and Finance",
    "Business Administration": "Business Administration and Marketing",
    "Marketing": "Business Administration and Marketing",
    "Information Resources Management": "Information Resources Management",
    "Agriculture": "Agriculture and Industrial Technology",
    "Biochemistry": "Biochemistry",
    "Microbiology": "Microbiology",
    "Biology": "Basic Sciences",
    "Chemistry": "Basic Sciences",
    "Mathematics": "Basic Sciences",
    "Physics/Electronics": "Basic Sciences",
    "Education": "Education",
    "History and International Studies": "History and International Studies",
    "Languages and Literary Studies": "Languages and Literary Studies",
    "Music and Creative Arts": "Music and Creative Arts",
    "Religious Studies": "Religious Studies",
    "Law": "Jurisprudence & Private Law",
    "Medicine and Surgery": "Medicine & Surgery",
    "Nursing Science": "Nursing",
    "Public Health": "Public Health",
    "Medical Laboratory Science": "Medical Laboratory Science",
    "Anatomy": "Anatomy",
    "Physiology": "Physiology",
    "Nutrition and Dietetics": "Nutrition and Dietetics",
    "Economics": "Economics",
    "Mass Communication": "Mass Communication",
    "Political Science & Public Administration": "Political Science and Public Administration",
    "Social Work": "Social Work"
};

function MobileEnroll() {
    const [formData, setFormData] = useState({
        name: '', matric_no: '', level: '', department: '', course: ''
    });
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    const [initializing, setInitializing] = useState(true);
    const [status, setStatus] = useState('IDLE');
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [poseStep, setPoseStep] = useState(0);
    const [captures, setCaptures] = useState([]);
    const [faceLandmarksPayload, setFaceLandmarksPayload] = useState(null);
    const [guidance, setGuidance] = useState(null);
    const [cameraError, setCameraError] = useState(false);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

    const videoRef = useRef();
    const canvasRef = useRef();
    const detectionFrameRef = useRef(null);

    const stateRef = useRef({ status: 'IDLE', poseStep: 0, captures: [], guidance: null });

    useEffect(() => {
        stateRef.current.status = status;
        stateRef.current.poseStep = poseStep;
        stateRef.current.captures = captures;
        stateRef.current.guidance = guidance;
    }, [status, poseStep, captures, guidance]);

    useEffect(() => {
        const loadResources = async () => {
            try {
                const cls = await api.classes.getAll();
                setClasses(Array.isArray(cls) ? cls : []);
                setMsg({ type: 'info', text: "Loading models... Please wait." });
                await Promise.all([
                    isMobile ? faceapi.nets.tinyFaceDetector.loadFromUri('/models') : faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setMsg({ type: '', text: "" });
                startVideo();
            } catch (err) {
                setMsg({ type: 'error', text: "Failed to load models: " + err.message });
            }
        };
        loadResources();
        return () => {
            if (detectionFrameRef.current) {
                if (isMobile) clearTimeout(detectionFrameRef.current);
                else cancelAnimationFrame(detectionFrameRef.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    setInitializing(false);
                    detectLoop();
                };
            }
        } catch (err) {
            console.error("Camera access denied or device missing", err);
            setMsg({ type: 'error', text: "Please allow camera permissions in your browser settings to enroll." });
            setCameraError(true);
        }
    };

    const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
            detectionFrameRef.current = isMobile
                ? setTimeout(detectLoop, 250)
                : requestAnimationFrame(detectLoop);
            return;
        }

        // Use native video resolution so canvas perfectly overlays crop bounds when using objectFit cover
        const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
        };

        if (displaySize.width > 0 && displaySize.height > 0 && canvasRef.current) {

            const detectionOptions = isMobile
                ? new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
                : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

            const detection = await faceapi.detectSingleFace(videoRef.current, detectionOptions)
                .withFaceLandmarks()
                .withFaceDescriptor();

            // Only overwrite canvas dimensions (which implicitly triggers a canvas clear state) if the display size actually changed!
            if (canvasRef.current.width !== displaySize.width || canvasRef.current.height !== displaySize.height) {
                faceapi.matchDimensions(canvasRef.current, displaySize);
            }

            const ctx = canvasRef.current.getContext('2d');
            // Clear prior frames precisely after awaiting ML to prevent visual flash
            ctx.clearRect(0, 0, displaySize.width, displaySize.height);

            if (detection) {
                const resizedDetections = faceapi.resizeResults(detection, displaySize);
                const box = resizedDetections.detection.box;
                const score = resizedDetections.detection.score;
                const isConfident = score > 0.75;

                ctx.strokeStyle = isConfident ? '#10b981' : '#f59e0b';
                ctx.lineWidth = 4;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                ctx.fillStyle = isConfident ? '#10b981' : '#f59e0b';
                ctx.font = '16px sans-serif';
                ctx.save();
                ctx.translate(box.x + box.width, box.y > 20 ? box.y - 5 : 20);
                ctx.scale(-1, 1);
                ctx.fillText(`${Math.round(score * 100)}%`, 0, 0);
                ctx.restore();

                const currentStatus = stateRef.current.status;

                if (currentStatus === 'DETECTING') {
                    // Mobile centering thresholds
                    const widthLimit = displaySize.width;
                    const isCentered = box.x > (widthLimit * 0.1) && (box.x + box.width) < (widthLimit * 0.9);
                    const isBigEnough = box.width > (widthLimit * 0.3);

                    let newGuidance = null;
                    if (!isConfident) newGuidance = "Hold Still";
                    else if (!isBigEnough) newGuidance = "Move Closer";
                    else if (!isCentered) newGuidance = "Center Your Face";

                    if (newGuidance !== stateRef.current.guidance) setGuidance(newGuidance);

                    if (isCentered && isBigEnough && isConfident) {
                        capturePhoto(detection.descriptor);
                    }
                }
            } else {
                const currentStatus = stateRef.current.status;
                if (currentStatus === 'DETECTING') {
                    if (stateRef.current.guidance !== "Look at Camera") setGuidance("Look at Camera");
                } else {
                    if (stateRef.current.guidance !== null) setGuidance(null);
                }
            }
        }

        detectionFrameRef.current = isMobile
            ? setTimeout(detectLoop, 250)
            : requestAnimationFrame(detectLoop);
    };

    const startEnrollment = () => {
        if (!formData.name || !formData.matric_no) {
            setMsg({ type: 'error', text: "Please enter Name and Matric No." });
            return;
        }
        setMsg({ type: 'info', text: "Look at the camera" });
        setPoseStep(0);
        setCaptures([]);
        setFaceLandmarksPayload(null);
        setStatus('DETECTING');
    };

    const capturePhoto = (descriptorVal) => {
        if (stateRef.current.status === 'CAPTURING') return;
        stateRef.current.status = 'CAPTURING'; // Immediately block concurrent detection loops
        setStatus('CAPTURING');
        setGuidance("Capturing...");

        if (stateRef.current.poseStep === 0) {
            setFaceLandmarksPayload(Array.from(descriptorVal));
        }

        const targetWidth = 320;
        const targetHeight = 240;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(blob => {
            setCaptures(prev => [...prev, blob]);

            if (stateRef.current.poseStep === 0) {
                setPoseStep(1);
                setMsg({ type: 'info', text: "Step 2: Turn head slightly (Keep glasses off)." });
                setGuidance("Great! Get ready for pose 2...");
                setTimeout(() => {
                    setStatus('DETECTING');
                    setGuidance(null);
                }, 4000);
            } else {
                setStatus('READY_TO_SUBMIT');
                setMsg({ type: 'success', text: "Captures complete! Ready to submit." });
                setGuidance("Done!");
            }
        }, 'image/jpeg', 0.8);
    };

    const handleSubmit = async () => {
        setStatus('SUBMITTING');
        const data = new FormData();
        data.append('name', formData.name);
        data.append('matric_no', formData.matric_no);
        data.append('level', formData.level);
        data.append('department', formData.department);
        data.append('course', formData.course);
        data.append('classIds', JSON.stringify(selectedClasses));

        if (faceLandmarksPayload) {
            data.append('faceLandmarks', JSON.stringify(faceLandmarksPayload));
        }

        const processCaptures = () => {
            return new Promise((resolve) => {
                let photoData = null;
                captures.forEach((blob, i) => {
                    data.append('images', blob, `capture_${i}.jpg`);
                    if (i === 0) {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => { photoData = reader.result; };
                    }
                });
                setTimeout(() => {
                    if (photoData) data.append('photo', photoData);
                    resolve();
                }, 300);
            });
        };

        try {
            await processCaptures();
            const res = await api.users.register(data);
            if (res.success) {
                setStatus('SUCCESS');
                setMsg({ type: 'success', text: "Enrollment Successful!" });
                setFormData({ name: '', matric_no: '', level: '', department: '', course: '' });
                setSelectedClasses([]);
                setCaptures([]);
                setFaceLandmarksPayload(null);
                setTimeout(() => setStatus('IDLE'), 3000);
            } else {
                setStatus('FAIL');
                setMsg({ type: 'error', text: res.error || "Enrollment failed." });
            }
        } catch (err) {
            setStatus('FAIL');
            setMsg({ type: 'error', text: err.message || "Network error. Check server." });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name' && !/^[a-zA-Z\s]*$/.test(value)) return;
        if (name === 'matric_no' && !/^[a-zA-Z0-9/\-]*$/.test(value)) return;

        const finalValue = name === 'name' ? value.toUpperCase() : value;

        if (name === 'course') {
            const mappedDepartment = courseToDepartmentMap[value] || '';
            setFormData({ ...formData, course: value, department: mappedDepartment });
            return;
        }
        setFormData({ ...formData, [name]: finalValue });
    };

    const toggleClass = (id) => setSelectedClasses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '1rem', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Mobile Enrollment</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

                {/* Form Section */}
                <div className="card" style={{ padding: '1.5rem', width: '100%' }}>
                    {msg.text && (
                        <div className={`badge badge-${msg.type === 'error' ? 'danger' : msg.type === 'success' ? 'success' : 'warning'}`}
                            style={{ padding: '0.75rem', width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <Info size={18} style={{ marginTop: '0.1rem', flexShrink: 0 }} /> <span>{msg.text}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} disabled={status !== 'IDLE'} style={{ width: '100%' }} />
                        <input name="matric_no" placeholder="Matric No" value={formData.matric_no} onChange={handleChange} disabled={status !== 'IDLE'} style={{ width: '100%' }} />

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select name="level" value={formData.level} onChange={handleChange} disabled={status !== 'IDLE'} style={{ width: '35%' }}>
                                <option value="">Level</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                                <option value="300">300</option>
                                <option value="400">400</option>
                                <option value="500">500</option>
                                <option value="600">600</option>
                            </select>
                            <input name="department" placeholder="Dept (Auto)" value={formData.department} disabled={true} style={{ width: '65%', background: '#f1f5f9', color: '#64748b' }} />
                        </div>

                        <select name="course" value={formData.course} onChange={handleChange} disabled={status !== 'IDLE'} style={{ width: '100%' }}>
                            <option value="">Select a Course</option>
                            {Object.keys(courseToDepartmentMap).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block', color: 'var(--text-main)' }}>Classes</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {classes.map(c => (
                                    <div key={c.id} onClick={() => status === 'IDLE' && toggleClass(c.id)}
                                        style={{
                                            padding: '6px 14px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, cursor: status === 'IDLE' ? 'pointer' : 'default',
                                            background: selectedClasses.includes(c.id) ? 'var(--primary)' : '#f1f5f9',
                                            color: selectedClasses.includes(c.id) ? 'white' : 'var(--text-secondary)',
                                            border: selectedClasses.includes(c.id) ? '2px solid rgba(59,130,246,0.3)' : '1px solid var(--border-light)'
                                        }}>
                                        {c.code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Camera Section */}
                <div className="card" style={{ padding: '0.5rem', width: '100%' }}>
                    {/* Fixed aspect ratio 1/1 for a perfectly square selfie look, overriding horizontal rectangles! */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', minHeight: '300px', borderRadius: 'calc(var(--radius-xl) - 0.5rem)', overflow: 'hidden', background: '#0f172a', border: '3px solid white', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}>
                        {cameraError ? (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)', zIndex: 10, padding: '1rem', textAlign: 'center' }}>
                                <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '0.5rem' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Camera Required</h3>
                                <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0 }}>Please allow camera permissions in your browser settings to enroll.</p>
                            </div>
                        ) : initializing && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontWeight: 500, zIndex: 10 }}>
                                Starting Camera...
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
                        />

                        <canvas
                            ref={canvasRef}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 5, transform: 'scaleX(-1)' }}
                        />

                        {/* Capture Thumbnails Overlay */}
                        <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.75rem', zIndex: 10 }}>
                            {captures.map((blob, i) => (
                                <div key={i} style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', overflow: 'hidden', border: '3px solid var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.4)', background: 'black' }}>
                                    <img src={URL.createObjectURL(blob)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                </div>
                            ))}
                        </div>

                        {/* Guidance Overlay */}
                        {guidance && (
                            <div style={{ position: 'absolute', top: '1rem', left: 0, right: 0, textAlign: 'center', zIndex: 6 }}>
                                <span style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', color: 'var(--text-main)', padding: '0.7rem 1.7rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', border: '1px solid var(--border-light)' }}>
                                    {guidance}
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-light)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}><Layers size={16} /> Steps</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: poseStep >= 0 ? 1 : 0.5, fontWeight: poseStep === 0 ? 700 : 400, marginBottom: '0.5rem' }}>
                                1. Front Pose (No Glasses)
                                {captures.length > 0 && <CheckCircle size={14} color="var(--success)" />}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: poseStep >= 1 ? 1 : 0.5, fontWeight: poseStep === 1 ? 700 : 400 }}>
                                2. Alternate Pose (Turn Head)
                                {captures.length > 1 && <CheckCircle size={14} color="var(--success)" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Actions Button */}
                <div style={{ width: '100%' }}>
                    {status === 'IDLE' && (
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '1rem' }} onClick={startEnrollment}>
                            <UserCheck size={20} /> START ENROLLMENT
                        </button>
                    )}
                    {status === 'READY_TO_SUBMIT' && (
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '1rem', background: 'var(--success)' }} onClick={handleSubmit}>
                            <CheckCircle size={20} /> SUBMIT PROFILE
                        </button>
                    )}
                    {(status === 'DETECTING' || status === 'CAPTURING') && (
                        <div className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '1rem', background: '#e0f2fe', color: '#0369a1', cursor: 'default' }}>
                            <Camera className="spin" size={20} style={{ marginRight: '8px' }} />
                            {poseStep === 0 ? "Scanning Face..." : "Scanning Second Pose..."}
                        </div>
                    )}
                    {status === 'FAIL' && (
                        <button className="btn btn-warning" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '1rem', background: 'var(--warning)', color: 'white', border: 'none' }} onClick={() => { setStatus('IDLE'); setMsg({ type: '', text: '' }); }}>
                            <RefreshCw size={20} /> RETRY ENROLLMENT
                        </button>
                    )}
                </div>

            </div>

            {/* Mobile Full-Screen Status Popup */}
            {(status === 'SUCCESS' || status === 'FAIL') && (
                <div className="animate-fade" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
                    <div className="animate-up" style={{ width: '100%', maxWidth: '340px', background: 'var(--bg-main)', borderRadius: '1.5rem', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: `1px solid ${status === 'SUCCESS' ? 'var(--success)' : 'var(--warning)'}` }}>
                        {status === 'SUCCESS' ? (
                            <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 1rem auto' }} />
                        ) : (
                            <AlertCircle size={64} style={{ color: 'var(--warning)', margin: '0 auto 1rem auto' }} />
                        )}
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            {status === 'SUCCESS' ? 'Enrollment Complete!' : 'Action Required'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
                            {msg.text || (status === 'SUCCESS' ? 'Face successfully registered.' : 'Enrollment failed.')}
                        </p>
                        <button
                            className={`btn ${status === 'SUCCESS' ? 'btn-success' : 'btn-warning'}`}
                            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontSize: '1rem', fontWeight: 800, background: status === 'SUCCESS' ? 'var(--success)' : 'var(--warning)', color: 'white', border: 'none' }}
                            onClick={() => {
                                setStatus('IDLE');
                                setMsg({ type: '', text: '' });
                            }}
                        >
                            {status === 'SUCCESS' ? 'DONE' : 'TRY AGAIN'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MobileEnroll;
