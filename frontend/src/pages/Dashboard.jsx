import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const API_HOST = API_URL.replace(/^https?:\/\//, '');

export default function Dashboard({ token, logout }) {
    const [urls, setUrls] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [statsCode, setStatsCode] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editUrlValue, setEditUrlValue] = useState('');
    const [editError, setEditError] = useState(null);
    const [editSaving, setEditSaving] = useState(false);

    const [activeMenu, setActiveMenu] = useState(null);
    const menuRef = useRef(null);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null });

    const [copiedId, setCopiedId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchUrls = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/urls`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUrls(data);
            }
        } catch (err) {
            console.error('Failed to fetch urls', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchUrls();
        }
    }, [token, fetchUrls]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        const handleScrollOrResize = () => {
            setActiveMenu(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, []);

    const toggleThreeDotsMenu = (e, item) => {
        e.stopPropagation();
        if (activeMenu && activeMenu.id === item.id) {
            setActiveMenu(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpwards = spaceBelow < 180;

            setActiveMenu({
                id: item.id,
                top: openUpwards ? 'auto' : rect.bottom + 6,
                bottom: openUpwards ? window.innerHeight - rect.top + 6 : 'auto',
                right: Math.max(10, window.innerWidth - rect.right),
                item
            });
        }
    };

    const validateAndNormalizeUrl = (input) => {
        if (!input || typeof input !== 'string' || !input.trim()) {
            return null;
        }
        let trimmed = input.trim();
        if (!/^https?:\/\//i.test(trimmed)) {
            trimmed = 'http://' + trimmed;
        }
        try {
            const parsed = new URL(trimmed);
            if (parsed.hostname && parsed.hostname.includes('.') && parsed.hostname.length > 3) {
                return parsed.toString();
            }
        } catch (_) {}
        return null;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);

        const normalized = validateAndNormalizeUrl(newUrl);
        if (!normalized) {
            setError('Invalid URL format. Please enter a valid URL (e.g. https://example.com).');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/shorten`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: normalized })
            });

            const data = await response.json();
            if (response.ok) {
                setNewUrl('');
                setError(null);
                fetchUrls();
            } else {
                setError(data.error || 'Failed to shorten URL');
            }
        } catch (err) {
            setError('An error occurred while creating short URL.');
        }
    };

    const handleCopy = (code, id) => {
        const shortUrl = `${API_URL}/${code}`;
        navigator.clipboard.writeText(shortUrl);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleViewStats = async (code) => {
        setActiveMenu(null);
        setStatsCode(code);
        setStatsLoading(true);
        try {
            const response = await fetch(`${API_URL}/analytics/${code}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStatsData(data);
            } else {
                setStatsData(null);
            }
        } catch (err) {
            console.error("Error fetching stats", err);
            setStatsData(null);
        } finally {
            setStatsLoading(false);
        }
    };

    const closeStats = () => {
        setStatsCode(null);
        setStatsData(null);
    };

    const startEdit = (item) => {
        setActiveMenu(null);
        setEditingId(item.id);
        setEditUrlValue(item.original_url);
        setEditError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditUrlValue('');
        setEditError(null);
    };

    const saveEdit = async (id) => {
        const normalized = validateAndNormalizeUrl(editUrlValue);
        if (!normalized) {
            setEditError('Invalid URL format. Please enter a valid URL (e.g. https://example.com).');
            return;
        }

        setEditSaving(true);
        setEditError(null);

        try {
            const response = await fetch(`${API_URL}/urls/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ original_url: normalized })
            });

            const data = await response.json();
            if (response.ok) {
                setEditingId(null);
                fetchUrls();
            } else {
                setEditError(data.error || 'Failed to update URL');
            }
        } catch (err) {
            setEditError('Failed to update URL.');
        } finally {
            setEditSaving(false);
        }
    };

    const openConfirmModal = (item) => {
        setActiveMenu(null);
        setConfirmModal({ isOpen: true, item });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, item: null });
    };

    const executeConfirmAction = async () => {
        const { item } = confirmModal;
        if (!item) return;

        try {
            const response = await fetch(`${API_URL}/urls/${item.id}/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchUrls();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete URL');
            }
        } catch (err) {
            setError('An error occurred while deleting URL.');
        } finally {
            closeConfirmModal();
        }
    };

    const totalPages = Math.ceil(urls.length / pageSize) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedUrls = urls.slice(startIndex, startIndex + pageSize);

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="brand-logo">
                    <h1>ShortIt Dashboard</h1>
                </div>
                <button onClick={() => setShowLogoutModal(true)} className="secondary-btn logout-btn">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '6px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </header>

            <div className="dashboard-content">
                <div className="create-section">
                    <form onSubmit={handleCreate} className="create-form" noValidate>
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => { setNewUrl(e.target.value); setError(null); }}
                            placeholder="Enter long URL to shorten (e.g. https://example.com/long-page)..."
                        />
                        <button type="submit" className="primary-btn">Shorten URL</button>
                    </form>
                    {error && <div className="error-message red-error">{error}</div>}
                </div>

                <div className="table-container">
                    {loading ? (
                        <p className="loading">Loading your URLs...</p>
                    ) : urls.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't created any short URLs yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="url-table">
                                    <thead>
                                        <tr>
                                            <th>Original URL</th>
                                            <th>Short Code / URL</th>
                                            <th className="action-col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUrls.map((item) => (
                                            <tr key={item.id}>
                                                <td className="url-cell">
                                                    {editingId === item.id ? (
                                                        <div className="inline-edit-box">
                                                            <input
                                                                type="url"
                                                                className="edit-input"
                                                                value={editUrlValue}
                                                                onChange={(e) => setEditUrlValue(e.target.value)}
                                                                placeholder="Enter new URL"
                                                                autoFocus
                                                            />
                                                            {editError && <div className="inline-error red-error">{editError}</div>}
                                                            <div className="edit-btn-group">
                                                                <button
                                                                    onClick={() => saveEdit(item.id)}
                                                                    disabled={editSaving}
                                                                    className="save-btn"
                                                                >
                                                                    {editSaving ? 'Saving...' : 'Save'}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="cancel-btn"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="truncate-cell" title={item.original_url}>
                                                            <a href={item.original_url} target="_blank" rel="noreferrer">
                                                                {item.original_url}
                                                            </a>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                     <a href={`${API_URL}/${item.short_code}`} target="_blank" rel="noreferrer" className="short-url-link">
                                                        {API_HOST}/{item.short_code}
                                                     </a>
                                                </td>
                                                <td className="action-col">
                                                    <div className="action-wrapper">
                                                        <button
                                                            onClick={() => handleCopy(item.short_code, item.id)}
                                                            className="copy-btn"
                                                            title="Copy to clipboard"
                                                        >
                                                            {copiedId === item.id ? 'Copied!' : 'Copy'}
                                                        </button>

                                                        <button
                                                            className="three-dots-btn"
                                                            onClick={(e) => toggleThreeDotsMenu(e, item)}
                                                            title="More Options"
                                                        >
                                                            &#8942;
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination-bar">
                                <div className="pagination-info">
                                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, urls.length)} of {urls.length} URLs
                                </div>
                                <div className="pagination-controls">
                                    <div className="page-size-selector">
                                        <label>Rows per page:</label>
                                        <select value={pageSize} onChange={handlePageSizeChange}>
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>

                                    <div className="page-buttons">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={safeCurrentPage === 1}
                                            className="page-nav-btn"
                                            title="Previous Page"
                                        >
                                            Prev
                                        </button>

                                        <span className="page-indicator">
                                            Page {safeCurrentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={safeCurrentPage >= totalPages}
                                            className="page-nav-btn"
                                            title="Next Page"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {activeMenu && (
                <div
                    className="dropdown-menu-fixed"
                    style={{
                        top: activeMenu.top !== 'auto' ? `${activeMenu.top}px` : 'auto',
                        bottom: activeMenu.bottom !== 'auto' ? `${activeMenu.bottom}px` : 'auto',
                        right: `${activeMenu.right}px`
                    }}
                    ref={menuRef}
                >
                    <button onClick={() => handleViewStats(activeMenu.item.short_code)} className="dropdown-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Analytics
                    </button>
                    <button onClick={() => startEdit(activeMenu.item)} className="dropdown-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </button>
                    <button onClick={() => openConfirmModal(activeMenu.item)} className="dropdown-item danger-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            )}

            {showLogoutModal && (
                <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="modal-content popup-dialog" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Logout</h2>
                            <button className="close-btn" onClick={() => setShowLogoutModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to log out of your account?</p>
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowLogoutModal(false)} className="secondary-btn">Cancel</button>
                            <button onClick={logout} className="primary-btn danger-btn-fill">Logout</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="modal-overlay" onClick={closeConfirmModal}>
                    <div className="modal-content popup-dialog" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Short URL</h2>
                            <button className="close-btn" onClick={closeConfirmModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete short URL <strong>{API_HOST}/{confirmModal.item?.short_code}</strong>?
                                This action cannot be undone and will permanently remove it from both dashboard and sharded storage.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button onClick={closeConfirmModal} className="secondary-btn">Cancel</button>
                            <button
                                onClick={executeConfirmAction}
                                className="primary-btn danger-btn-fill"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {statsCode && (
                <div className="modal-overlay" onClick={closeStats}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Analytics Dashboard for {statsCode}</h2>
                            <button className="close-btn" onClick={closeStats}>&times;</button>
                        </div>
                        {statsLoading ? (
                            <p className="loading">Loading analytics...</p>
                        ) : statsData ? (
                            <div className="stats-body">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <h3>Total Clicks</h3>
                                        <p className="stat-val">{statsData.totalClicks}</p>
                                    </div>
                                    <div className="stat-box">
                                        <h3>Avg Latency</h3>
                                        <p className="stat-val">{statsData.avgLatency} ms</p>
                                    </div>
                                </div>

                                {statsData.totalClicks > 0 ? (
                                    <>
                                        <h3 className="section-title">Browser Breakdown</h3>
                                        <div className="bars-container">
                                            {statsData.browserStats.map(b => (
                                                <div className="bar-row" key={b.name}>
                                                    <div className="bar-label">
                                                        <span>{b.name}</span>
                                                        <span>{b.percentage}%</span>
                                                    </div>
                                                    <div className="bar-bg">
                                                        <div className="bar-fill" style={{ width: `${b.percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="empty-state">No clicks recorded yet.</p>
                                )}
                            </div>
                        ) : (
                            <p className="error-message red-error">Could not load analytics data.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
