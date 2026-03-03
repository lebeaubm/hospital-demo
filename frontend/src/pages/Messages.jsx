import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

function Messages() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadMessage, setNewThreadMessage] = useState('');
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { threadId } = useParams();

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (threadId) {
      loadThread(parseInt(threadId));
    }
  }, [threadId]);

  const fetchThreads = async () => {
    try {
      const response = await api.get('/api/messages/threads/');
      setThreads(response.data);
    } catch (err) {
      console.error('Failed to load message threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (id) => {
    try {
      const thread = threads.find((t) => t.id === id);
      if (thread) {
        setSelectedThread(thread);
        const response = await api.get(`/messages/threads/${id}/`);
        setMessages(response.data.messages || []);
        
        // Refresh threads to update unread count
        fetchThreads();
      }
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
      loadThread(selectedThread.id);
    } catch (err) {
      alert('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const createThread = async (e) => {
    e.preventDefault();
    if (!newThreadSubject.trim() || !newThreadMessage.trim()) return;

    setSending(true);
    try {
      const threadResponse = await api.post('/api/messages/threads/create/', {
        subject: newThreadSubject,
      });
      
      const newThreadId = threadResponse.data.id;
      
      await api.post(`/api/messages/threads/${newThreadId}/messages/`, {
        content: newThreadMessage,
      });
      
      setShowNewThreadModal(false);
      setNewThreadSubject('');
      setNewThreadMessage('');
      fetchThreads();
      navigate(`/messages/${newThreadId}`);
    } catch (err) {
      alert('Failed to create thread');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Thread List Sidebar */}
        <div className="col-md-4 col-lg-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2> Messages</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewThreadModal(true)}
            >
               New
            </button>
          </div>

          <div className="list-group">
            {threads.length === 0 ? (
              <div className="alert alert-info">No messages yet</div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`list-group-item list-group-item-action ${
                    selectedThread?.id === thread.id ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate(`/messages/${thread.id}`);
                  }}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">
                      {thread.subject}
                      {thread.unread_count > 0 && (
                        <span className="badge bg-danger ms-2">
                          {thread.unread_count}
                        </span>
                      )}
                    </h6>
                    <small>
                      <span className={`badge bg-${thread.status === 'OPEN' ? 'success' : 'secondary'}`}>
                        {thread.status}
                      </span>
                    </small>
                  </div>
                  
                  {thread.staff_name && (
                    <p className="mb-1 small">
                       {thread.staff_name}
                    </p>
                  )}
                  
                  {thread.last_message && (
                    <p className="mb-1 text-muted small">
                      {thread.last_message.content}
                    </p>
                  )}
                  
                  <small className="text-muted">
                    {thread.message_count} messages • 
                    {thread.last_message_at && 
                      ` ${new Date(thread.last_message_at).toLocaleDateString()}`
                    }
                  </small>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread View */}
        <div className="col-md-8 col-lg-9">
          {selectedThread ? (
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">{selectedThread.subject}</h5>
                {selectedThread.staff_name && (
                  <small>with {selectedThread.staff_name}</small>
                )}
              </div>
              
              <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <div className="alert alert-info">No messages in this thread yet</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 ${
                        message.sender_role === 'PATIENT' ? 'text-end' : ''
                      }`}
                    >
                      <div
                        className={`card d-inline-block ${
                          message.sender_role === 'PATIENT'
                            ? 'bg-primary text-white'
                            : 'bg-light'
                        }`}
                        style={{ maxWidth: '75%' }}
                      >
                        <div className="card-body p-3">
                          <div className="mb-2">
                            <strong>
                              {message.sender_role === 'PATIENT' ? '' : ''}{' '}
                              {message.sender_name}
                            </strong>
                            <br />
                            <small className={message.sender_role === 'PATIENT' ? 'text-white-50' : 'text-muted'}>
                              {new Date(message.created_at).toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="card-footer">
                <form onSubmit={sendMessage}>
                  <div className="input-group">
                    <textarea
                      className="form-control"
                      placeholder="Type your message..."
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
                      {sending ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        ' Send'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              Select a conversation or start a new one
            </div>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Message</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNewThreadModal(false)}
                />
              </div>
              <form onSubmit={createThread}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newThreadSubject}
                      onChange={(e) => setNewThreadSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={newThreadMessage}
                      onChange={(e) => setNewThreadMessage(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewThreadModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
