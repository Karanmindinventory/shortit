import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, logout }) {
    const [urls, setUrls] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Stats Modal State
    const [statsCode, setStatsCode] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchUrls = async () => {
        try {
            const response = await fetch('http://localhost:3000/urls', {
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
    };

    useEffect(() => {
        if (token) {
            fetchUrls();
        }
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: newUrl })
            });

            const data = await response.json();
            if (response.ok) {
                setNewUrl('');
                fetchUrls();
            } else {
                setError(data.error || 'Failed to shorten URL');
            }
        } catch (err) {
            setError('An error occurred');
        }
    };

    const handleCopy = (code) => {
        const shortUrl = `http://localhost:3000/${code}`;
        navigator.clipboard.writeText(shortUrl);
    };

    const handleViewStats = async (code) => {
        setStatsCode(code);
        setStatsLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/analytics/${code}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStatsData(data);
            } else {
                setStatsData(null);
            }
        } catch(err) {
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

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>ShortIt Dashboard</h1>
                <button onClick={logout} className="secondary-btn">Logout</button>
            </header>

            <div className="dashboard-content">
                <div className="create-section">
                    <form onSubmit={handleCreate} className="create-form">
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="Enter long URL to shorten..."
                            required
                        />
                        <button type="submit" className="primary-btn">Create</button>
                    </form>
                    {error && <div className="error-message">{error}</div>}
                </div>

                <div className="table-container">
                    {loading ? (
                        <p className="loading">Loading your URLs...</p>
                    ) : urls.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't created any short URLs yet.</p>
                        </div>
                    ) : (
                        <table className="url-table">
                            <thead>
                                <tr>
                                    <th>Original URL</th>
                                    <th>Short URL</th>
                                    <th className="action-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {urls.map((item) => (
                                    <tr key={item.id}>
                                        <td className="truncate-cell" title={item.original_url}>
                                            <a href={item.original_url} target="_blank" rel="noreferrer">
                                                {item.original_url}
                                            </a>
                                        </td>
                                        <td>
                                            <a href={`http://localhost:3000/${item.short_code}`} target="_blank" rel="noreferrer">
                                                localhost:3000/{item.short_code}
                                            </a>
                                        </td>
                                        <td className="action-col" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleViewStats(item.short_code)}
                                                className="secondary-btn"
                                                title="View Analytics"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleCopy(item.short_code)}
                                                className="copy-btn"
                                                title="Copy to clipboard"
                                            >
                                                Copy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Stats Modal */}
            {statsCode && (
                <div className="modal-overlay" onClick={closeStats}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Analytics for: {statsCode}</h2>
                            <button className="close-btn" onClick={closeStats}>&times;</button>
                        </div>
                        {statsLoading ? (
                            <p className="loading">Loading stats...</p>
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
                                        <h3 className="section-title">Browsers</h3>
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
                            <p className="error-message">Could not load stats.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
