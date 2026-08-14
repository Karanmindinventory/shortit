import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, logout }) {
    const [urls, setUrls] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

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
                fetchUrls(); // Refresh the list
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
        // Optional: show a small toast here if we had one
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
                                        <td className="action-col">
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
        </div>
    );
}
