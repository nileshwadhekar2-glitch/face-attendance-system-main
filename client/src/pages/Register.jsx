import React, { useEffect, useRef, useState } from 'react';
import { UserCheck, Camera, Info, AlertCircle, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api';
import * as faceapi from 'face-api.js';

const courseToDepartmentMap = {
    // School of Computing and Engineering Sciences
    "Computer Science": "Computer Science",
    "Software Engineering": "Software Engineering",
    "Information Technology": "Information Technology",
    "Computer Engineering": "Engineering",
    "Civil Engineering": "Engineering",
    "Electrical & Electronics Engineering": "Engineering",
    "Mechanical Engineering": "Engineering",

    // School of Management Sciences
    "Accounting": "Accounting",
    "Banking & Finance": "Banking and Finance",
    "Business Administration": "Business Administration and Marketing",
    "Marketing": "Business Administration and Marketing",
    "Information Resources Management": "Information Resources Management",

    // School of Science and Technology
    "Agriculture": "Agriculture and Industrial Technology",
    "Biochemistry": "Biochemistry",
    "Microbiology": "Microbiology",
    "Biology": "Basic Sciences",
    "Chemistry": "Basic Sciences",
    "Mathematics": "Basic Sciences",
    "Physics/Electronics": "Basic Sciences",

    // School of Education and Humanities
    "Education": "Education",
    "History and International Studies": "History and International Studies",
    "Languages and Literary Studies": "Languages and Literary Studies",
    "Music and Creative Arts": "Music and Creative Arts",
    "Religious Studies": "Religious Studies",

    // School of Law and Security Studies
    "Law": "Jurisprudence & Private Law",

    // College of Health and Medical Sciences
    "Medicine and Surgery": "Medicine & Surgery",
    "Nursing Science": "Nursing",
    "Public Health": "Public Health",
    "Medical Laboratory Science": "Medical Laboratory Science",
    "Anatomy": "Anatomy",
    "Physiology": "Physiology",
    "Nutrition and Dietetics": "Nutrition and Dietetics",

    // School of Social Sciences
    "Economics": "Economics",
    "Mass Communication": "Mass Communication",
    "Political Science & Public Administration": "Political Science and Public Administration",
    "Social Work": "Social Work"
};

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        matric_no: '',
        level: '',
        department: '',
        course: ''
    });
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    // UI States
    const [initializing, setInitializing] = useState(true);
    const [status, setStatus] = useState('IDLE'); // IDLE, DETECTING, CAPTURING, READY_TO_SUBMIT, SUBMITTING, SUCCESS, FAIL
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [poseStep, setPoseStep] = useState(0); // 0: Front, 1: Angle/Glasses-off
    const [captures, setCaptures] = useState([]);
    const [faceLandmarksPayload, setFaceLandmarksPayload] = useState(null); // The 128D array
    const [guidance, setGuidance] = useState(null); // Real-time feedback overlay
    const [cameraError, setCameraError] = useState(false);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // Bounding Box state removed, using Canvas Ref instead

    const videoRef = useRef();
    const canvasRef = useRef(); // Bounding box overlay
    const detectionFrameRef = useRef(null);

    // Refs for Loop Access (Fix Stale Closures)
    const stateRef = useRef({
        status: 'IDLE',
        poseStep: 0,
        captures: [],
        guidance: null
    });

    // Sync Refs
    useEffect(() => {
        stateRef.current.status = status;
        stateRef.current.poseStep = poseStep;
        stateRef.current.captures = captures;
        stateRef.current.guidance = guidance;
    }, [status, poseStep, captures, guidance]);

    // Load Classes & Detector
    useEffect(() => {
        const loadResources = async () => {
            try {
                // 1. Load Classes
                const cls = await api.classes.getAll();
                setClasses(Array.isArray(cls) ? cls : []);

                // 2. Load face-api.js models from '/models'
                setMsg({ type: 'info', text: "Loading models... Please wait." });
                await Promise.all([
                    isMobile ? faceapi.nets.tinyFaceDetector.loadFromUri('/models') : faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setMsg({ type: '', text: "" }); // clear loading msg

                startVideo();
            } catch (err) {
                console.error("Init failed:", err);
                setMsg({ type: 'error', text: "Failed to load face-api models: " + err.message });
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

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        setInitializing(false);
                        detectLoop();
                    };
                }
            })
            .catch(err => {
                console.error("Camera access denied or device missing", err);
                setMsg({ type: 'error', text: "Camera access denied." });
                setCameraError(true);
            });
    };

    const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
            detectionFrameRef.current = isMobile
                ? setTimeout(detectLoop, 250)
                : requestAnimationFrame(detectLoop);
            return;
        }

        const detectionOptions = isMobile
            ? new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
            : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

        const detection = await faceapi.detectSingleFace(videoRef.current, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        // Pass bounding box to React state
        const displaySize = { width: 640, height: 480 };

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, 640, 480);

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

                // Auto-Capture Logic
                const currentStatus = stateRef.current.status;

                if (currentStatus === 'DETECTING') {
                    const isCentered = box.x > 100 && (box.x + box.width) < 540;
                    const isBigEnough = box.width > 120; // Size threshold

                    let newGuidance = null;

                    if (!isConfident) {
                        newGuidance = "Hold Still";
                    } else if (!isBigEnough) {
                        newGuidance = "Move Closer";
                    } else if (!isCentered) {
                        newGuidance = "Center Your Face";
                    }

                    // Update Guidance if changed
                    if (newGuidance !== stateRef.current.guidance) {
                        setGuidance(newGuidance);
                    }

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
        // Prevent double capture
        if (stateRef.current.status === 'CAPTURING') return;
        stateRef.current.status = 'CAPTURING'; // Immediately block concurrent detection loops

        setStatus('CAPTURING');
        setGuidance("Capturing...");

        // Save the first successful descriptor as the faceLandmarks payload
        if (stateRef.current.poseStep === 0) {
            // Convert Float32Array to standard array
            setFaceLandmarksPayload(Array.from(descriptorVal));
        }

        // Size for transfer (smaller = faster)
        const targetWidth = 320;
        const targetHeight = 240;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Draw resized version
        ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(blob => {
            setCaptures(prev => [...prev, blob]);

            if (stateRef.current.poseStep === 0) {
                // Done with step 1
                setPoseStep(1);
                setMsg({ type: 'info', text: "Step 2: Turn head slightly (Keep glasses off)." });
                setGuidance("Great! Get ready for pose 2...");

                // Small delay before next capture to let user read
                setTimeout(() => {
                    setStatus('DETECTING');
                    setGuidance(null);
                }, 4000);
            } else {
                // Done with step 2
                setStatus('READY_TO_SUBMIT');
                setMsg({ type: 'success', text: "Captures complete! Ready to submit." });
                setGuidance("Done!");
            }
        }, 'image/jpeg', 0.8); // Slightly lower quality for even faster transfer
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

        // Process blobs into form data and base64 for the primary photo
        const processCaptures = () => {
            return new Promise((resolve) => {
                let photoData = null;
                captures.forEach((blob, i) => {
                    data.append('images', blob, `capture_${i}.jpg`);
                    if (i === 0) {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => {
                            photoData = reader.result;
                        };
                    }
                });

                // Slight delay to ensure FileReader finishes
                setTimeout(() => {
                    if (photoData) {
                        data.append('photo', photoData);
                    }
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
        if (name === 'name') {
            if (!/^[a-zA-Z\s]*$/.test(value)) return;
        }
        if (name === 'matric_no') {
            if (!/^[a-zA-Z0-9/\-]*$/.test(value)) return;
        }

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
        <div className="page-container animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 className="responsive-title" style={{ fontSize: '2.5rem', fontWeight: 900 }}>Biometric Enrollment</h2>
            </div>

            <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Form Section */}
                <div className="card responsive-padding" style={{ padding: '2rem' }}>
                    {msg.text && (
                        <div className={`badge badge-${msg.type === 'error' ? 'danger' : msg.type === 'success' ? 'success' : 'warning'}`}
                            style={{ padding: '1rem', width: '100%', marginBottom: '1rem', display: 'flex', gap: '8px', fontSize: '1rem' }}>
                            <Info size={18} /> {msg.text}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} disabled={status !== 'IDLE'} />
                        <input name="matric_no" placeholder="Matric No" value={formData.matric_no} onChange={handleChange} disabled={status !== 'IDLE'} />
                        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem' }}>
                            <select name="level" value={formData.level} onChange={handleChange} disabled={status !== 'IDLE'} style={{ background: 'var(--bg-main)', padding: '1rem 0.5rem' }}>
                                <option value="">Level</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                                <option value="300">300</option>
                                <option value="400">400</option>
                                <option value="500">500</option>
                                <option value="600">600</option>
                            </select>
                            <input name="department" placeholder="Department (Auto-filled)" value={formData.department} disabled={true} style={{ background: '#f1f5f9', color: '#64748b' }} />
                        </div>
                        <select name="course" value={formData.course} onChange={handleChange} disabled={status !== 'IDLE'} style={{ background: 'var(--bg-main)' }}>
                            <option value="">Select a Course</option>
                            {Object.keys(courseToDepartmentMap).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Classes</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {classes.map(c => (
                                    <div key={c.id} onClick={() => status === 'IDLE' && toggleClass(c.id)}
                                        style={{
                                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', cursor: status === 'IDLE' ? 'pointer' : 'default',
                                            background: selectedClasses.includes(c.id) ? 'var(--primary)' : '#e2e8f0',
                                            color: selectedClasses.includes(c.id) ? 'white' : '#64748b',
                                            border: '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                        {c.code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        {status === 'IDLE' && (
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={startEnrollment}>
                                <UserCheck size={20} /> Start Enrollment
                            </button>
                        )}
                        {status === 'READY_TO_SUBMIT' && (
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit}>
                                <CheckCircle size={20} /> Submit Profile
                            </button>
                        )}
                        {(status === 'DETECTING' || status === 'CAPTURING') && (
                            <div className="btn" style={{ width: '100%', textAlign: 'center', background: '#e0f2fe', color: '#0369a1', cursor: 'default' }}>
                                <Camera className="spin" size={20} style={{ marginRight: '8px' }} />
                                {poseStep === 0 ? "Scanning Face..." : "Scanning Second Pose..."}
                            </div>
                        )}
                        {status === 'FAIL' && (
                            <button className="btn btn-warning" style={{ width: '100%' }} onClick={() => { setStatus('IDLE'); setMsg({ type: '', text: '' }); }}>
                                <RefreshCw size={20} /> Retry Enrollment
                            </button>
                        )}
                    </div>
                </div>

                {/* Camera Section */}
                <div>
                    <div className="video-wrapper" style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
                        {cameraError ? (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                                <AlertCircle size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Webcam Not Detected</h3>
                                <p style={{ opacity: 0.8, textAlign: 'center', padding: '0 1rem' }}>Please allow camera permissions or connect a webcam to enroll.</p>
                            </div>
                        ) : initializing && <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Initializing Biometric Sensors...</div>}

                        {/* Video Layer */}
                        <video ref={videoRef} autoPlay muted playsInline style={{ width: '640px', height: 'auto', display: 'block', maxWidth: '100%' }}></video>

                        {/* Canvas Bounding Box Overlay */}
                        <canvas ref={canvasRef} width="640" height="480" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }} />

                        {/* Captures Thumbnails */}
                        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', gap: '10px', justifyContent: 'center', zIndex: 10 }}>
                            {captures.map((blob, i) => (
                                <div key={i} style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '3px solid var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                                    <img src={URL.createObjectURL(blob)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                        {/* Guidance Overlay */}
                        {guidance && (
                            <div style={{ position: 'absolute', bottom: '20%', left: '0', right: '0', textAlign: 'center', zIndex: 6 }}>
                                <span style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', color: 'var(--text-main)', padding: '0.6rem 1.5rem', borderRadius: '30px', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)' }}>
                                    {guidance}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="card responsive-padding" style={{ marginTop: '1rem', padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={18} /> Enrollment Steps</h4>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <div style={{ opacity: poseStep >= 0 ? 1 : 0.5, fontWeight: poseStep === 0 ? 700 : 400, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                1. Front Face Capture (No Glasses)
                                {captures.length > 0 && <CheckCircle size={14} color="var(--success)" />}
                            </div>
                            <div style={{ opacity: poseStep >= 1 ? 1 : 0.5, fontWeight: poseStep === 1 ? 700 : 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                2. Alternate Pose (Turn Head Slightly)
                                {captures.length > 1 && <CheckCircle size={14} color="var(--success)" />}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Register;
