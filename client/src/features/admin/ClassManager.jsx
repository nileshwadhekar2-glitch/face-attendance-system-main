import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Layers, Search, X, Users, Bookmark, Hash } from 'lucide-react';
import { api } from '../../api';

function ClassManager({ debouncedSearch = '', searchQuery, setSearchQuery }) {
    const [classes, setClasses] = useState([]);
    const [newClass, setNewClass] = useState({ name: '', code: '', department: '' });
    const [selectedClass, setSelectedClassModal] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const data = await api.classes.getAll();
            if (Array.isArray(data)) {
                setClasses(data);
            } else {
                console.error("Invalid classes format:", data);
                setClasses([]);
            }
        } catch (e) {
            console.error("Failed to fetch classes:", e);
        }
    };

    const handleCreate = async () => {
        if (!newClass.name || !newClass.code) return alert('Name and Code are required');
        try {
            const res = await api.classes.create(newClass);
            if (res.error) {
                alert(res.error);
            } else {
                setNewClass({ name: '', code: '', department: '' });
                fetchClasses();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create class. Please ensure the server is running and updated.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this class?')) {
            await api.classes.delete(id);
            fetchClasses();
        }
    };

    const handleExport = async (classId) => {
        try {
            const url = api.attendance.exportMatrixUrl(classId, true);
            await api.attendance.downloadExportBlob(url, `class_matrix_${classId}.xlsx`);
        } catch (error) {
            alert('Failed to export. ' + error.message);
        }
    };

    return (
        <div className="animate-fade" style={{ padding: '2.5rem' }}>
            <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem', borderTop: '5px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Plus className="text-primary" size={24} />
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Add New Class</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Course Code</label>
                        <input
                            placeholder="e.g. COSC 305"
                            value={newClass.code}
                            onChange={e => setNewClass({ ...newClass, code: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Course Title</label>
                        <input
                            placeholder="e.g. Software Engineering"
                            value={newClass.name}
                            onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                        <input
                            placeholder="Optional"
                            value={newClass.department}
                            onChange={e => setNewClass({ ...newClass, department: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate} style={{ height: '42px' }}>
                        Create Class
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers className="text-secondary" size={20} />
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Existing Classes</h3>
                </div>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input placeholder="Filter live by Class Code or Title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
                </div>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>CODE</th>
                            <th>TITLE</th>
                            <th>DEPARTMENT</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const filteredClasses = classes.filter(cls =>
                                cls.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                                cls.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                            );
                            const totalPages = Math.ceil(filteredClasses.length / itemsPerPage) || 1;
                            const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                            if (filteredClasses.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No classes matching your query were found.
                                        </td>
                                    </tr>
                                );
                            }

                            return <>
                                {paginatedClasses.map((cls, i) => (
                                    <tr key={cls.id} className="animate-up clickable" onClick={() => setSelectedClassModal(cls)} style={{ animationDelay: `${i * 0.05}s` }}>
                                        <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{cls.code}</td>
                                        <td style={{ fontWeight: 600 }}>{cls.name}</td>
                                        <td className="text-muted">{cls.department || '-'}</td>
                                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleExport(cls.id); }}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                            >
                                                EXPORT RECORDS
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                                                className="btn btn-secondary"
                                                style={{ color: 'var(--danger)', padding: '0.4rem' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {totalPages > 1 && (
                                    <tr>
                                        <td colSpan="5">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClasses.length)} of {filteredClasses.length} entries
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

            {selectedClass && (
                <div className="modal-overlay animate-fade" onClick={() => setSelectedClassModal(null)} style={{ backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}>
                    <div className="modal-content animate-up" onClick={e => e.stopPropagation()} style={{ padding: '2.5rem', maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BookOpen className="text-primary" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Class Details</h2>
                            </div>
                            <button onClick={() => setSelectedClassModal(null)} className="btn" style={{ padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    <BookOpen size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Title</span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{selectedClass.name}</div>
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    <Hash size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Code</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{selectedClass.code}</div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    <Users size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Enrolled</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>{selectedClass.enrolled_count || 0}</div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    <Bookmark size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{selectedClass.department || '-'}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '3rem' }}>
                            <button onClick={() => setSelectedClassModal(null)} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 800 }}>
                                DISMISS DETAILS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassManager;
