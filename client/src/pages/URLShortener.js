import React, { useState } from 'react';

const URLShortener = () => {
  const [url, setUrl] = useState('');
  const [customShortcode, setCustomShortcode] = useState('');
  const [validity, setValidity] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentUrls, setRecentUrls] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/shorturls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          shortcode: customShortcode.trim() || undefined,
          validity: parseInt(validity)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setResult(data);
      setRecentUrls(prev => [data, ...prev.slice(0, 4)]);
      
      setUrl('');
      setCustomShortcode('');
      setValidity(30);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5em', margin: '0', color: '#333' }}>🔗 URL Shortener</h1>
        <p style={{ color: '#666' }}>Create custom short links with expiration</p>
      </div>

      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Enter URL to shorten"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Custom shortcode (optional)"
            value={customShortcode}
            onChange={(e) => setCustomShortcode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            maxLength={20}
            style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          <input
            type="number"
            placeholder="Validity (minutes)"
            value={validity}
            onChange={(e) => setValidity(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
        </div>

        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '15px', 
            fontSize: '16px', 
            background: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Creating...' : 'Shorten URL'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#d4edda', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>✅ Success!</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <strong style={{ fontSize: '18px', color: '#0066cc' }}>{result.shortUrl}</strong>
            <button onClick={() => copyToClipboard(result.shortUrl)} style={{ padding: '5px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Copy</button>
            <button onClick={() => window.open(result.shortUrl, '_blank')} style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Open</button>
          </div>
          <p style={{ margin: '0', fontSize: '14px', color: '#155724' }}>
            {result.isCustom ? '🎯 Custom' : '🎲 Auto'} • ⏰ {formatTime(result.expiresAt)} remaining
          </p>
        </div>
      )}

      {recentUrls.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📋 Recent URLs</h3>
          {recentUrls.map((item, index) => (
            <div key={index} style={{ padding: '10px 0', borderBottom: index < recentUrls.length - 1 ? '1px solid #eee' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '16px', color: '#0066cc' }}>/{item.shortcode}</span>
                <div>
                  {item.isCustom && <span style={{ background: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '3px', fontSize: '12px', marginRight: '5px' }}>CUSTOM</span>}
                  <button onClick={() => copyToClipboard(item.shortUrl)} style={{ padding: '3px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '3px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}>Copy</button>
                  <button onClick={() => window.open(item.shortUrl, '_blank')} style={{ padding: '3px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Open</button>
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div style={{ marginBottom: '3px', wordBreak: 'break-all' }}>{item.originalUrl}</div>
                <div>⏰ {formatTime(item.expiresAt)} remaining</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default URLShortener;