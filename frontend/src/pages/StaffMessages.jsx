import { useEffect, useState } from 'react';
import { api } from '../api/client';

function StaffMessages() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await api.get('/api/staff/messages/threads/');
      setThreads(response.data);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (thread) => {
    try {
      const response = await api.get(`/api/messages/threads/${thread.id}/`);
      setSelectedThread(response.data);
      setMessages(response.data.messages || []);
      fetchThreads();
    } catch (err) {
      console.error('Failed to load thread:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    try {
      await api.post(`/api/messages/threads/${selectedThread.id}/messages/`, {
        content: newMessage,
      });
      setNewMessage('');
      const response = await api.get(`/api/messages/threads/${selectedThread.id}/`);
      setSelectedThread(response.data);
      setMessages(response.data.messages || []);
    } catch (err) {
      alert('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const closeThread = async (threadId) => {
    try {
      await api.patch(`/api/staff/messages/threads/${threadId}/`, { status: 'CLOSED' });
      fetchThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread((prev) => ({ ...prev, status: 'CLOSED' }));
      }
    } catch (err) {
      console.error('Failed to close thread:', err);
    }
  };

  const reopenThread = async (threadId) => {
    try {
      await api.patch(`/api/staff/messages/threads/${threadId}/`, { status: 'OPEN' });
      fetchThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread((prev) => ({ ...prev, status: 'OPEN' }));
      }
    } catch (err) {
      console.error('Failed to reopen thread:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-3"> Staff Messages</h2>
      <div className="row" style={{ height: 'calc(100vh - 140px)' }}>

        {/* Thread list */}
        <div className="col-md-4 col-lg-3 d-flex flex-column">
          <div className="card flex-grow-1" style={{ overflowY: 'auto' }}>
            <div className="card-header fw-bold">All Conversations ({threads.length})</div>
            <div className="list-group list-group-flush">
              {threads.length === 0 ? (
                <div className="list-group-item text-muted">No messages yet</div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    className={`list-group-item list-group-item-action ${selectedThread?.id === thread.id ? 'active' : ''}`}
                    onClick={() => loadThread(thread)}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-2">
                        <div className="fw-semibold small">
                          {thread.subject}
                          {thread.unread_count > 0 && (
                            <span className="badge bg-danger ms-1">{thread.unread_count}</span>
                          )}
                        </div>
                        <div className="text-muted small">{thread.patient_name || 'Patient'}</div>
                      </div>
                      <span className={`badge bg-${thread.status === 'OPEN' ? 'success' : 'secondary'} flex-shrink-0`}>
                        {thread.status}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      {thread.message_count} msg{thread.message_count !== 1 ? 's' : ''}
                      {thread.last_message_at && ` · ${new Date(thread.last_message_at).toLocaleDateString()}`}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Message view */}
        <div className="col-md-8 col-lg-9 d-flex flex-column">
          {selectedThread ? (
            <div className="card flex-grow-1 d-flex flex-column">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{selectedThread.subject}</h5>
                  <small>
                    Patient: {selectedThread.patient_name || 'Unknown'}&nbsp;&nbsp;|&nbsp;&nbsp;
                    Status: <strong>{selectedThread.status}</strong>
                  </small>
                </div>
                <div>
                  {selectedThread.status === 'OPEN' ? (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => closeThread(selectedThread.id)}
                    >
                      Close Thread
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => reopenThread(selectedThread.id)}
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body flex-grow-1 overflow-auto" style={{ maxHeight: '60vh' }}>
                {messages.length === 0 ? (
                  <div className="alert alert-info">No messages yet</div>
                ) : (
                  messages.map((message) => {
                    const isStaff = message.sender_role !== 'PATIENT';
                    return (
                      <div key={message.id} className={`mb-3 ${isStaff ? 'text-end' : ''}`}>
                        <div
                          className={`card d-inline-block ${isStaff ? 'bg-primary text-white' : 'bg-light'}`}
                          style={{ maxWidth: '75%' }}
                        >
                          <div className="card-body p-3">
                            <div className="mb-1">
                              <strong>{message.sender_name}</strong>
                              <span className={`ms-2 badge ${isStaff ? 'bg-light text-primary' : 'bg-secondary'}`}>
                                {message.sender_role}
                              </span>
                              <br />
                              <small className={isStaff ? 'text-white-50' : 'text-muted'}>
                                {new Date(message.created_at).toLocaleString()}
                              </small>
                            </div>
                            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedThread.status === 'OPEN' ? (
                <div className="card-footer">
                  <form onSubmit={sendMessage}>
                    <div className="input-group">
                      <textarea
                        className="form-control"
                        placeholder="Type your reply..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows="2"
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? <span className="spinner-border spinner-border-sm" /> : ' Send'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="card-footer text-muted text-center small">
                  This thread is closed. Reopen it to reply.
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-info mt-2">Select a conversation to view messages</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffMessages;
