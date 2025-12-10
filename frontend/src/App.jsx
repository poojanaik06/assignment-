import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Simple Icon Components (SVG) to avoid extra dependencies
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const SendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const SparkleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#brand-grad)"><defs><linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1b3544" /><stop offset="100%" stopColor="#6EB487" /></linearGradient></defs><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9zm0-2c-3.87 0-7-3.13-7-7 0-3.87 3.13-7 7-7 3.87 0 7 3.13 7 7 0 3.87-3.13 7-7 7z"/></svg>;

function App() {
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState([]); // Array of {role: 'user'|'ai', content: string}
  const [loading, setLoading] = useState(false);
  
  // Auto-resize textarea
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  const OLLAMA_MODEL = "gemma3:4b";
  const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";

  useEffect(() => {
    // Scroll to bottom when messages change
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInput = (e) => {
    setTopic(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSend = async () => {
    if (!topic.trim()) return;

    // 1. Add User Message
    const userMsg = { role: 'user', content: topic };
    setMessages(prev => [...prev, userMsg]);
    const currentTopic = topic;
    setTopic(""); // Clear input
    if(textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height
    
    setLoading(true);

    // 2. Add Temporary Loading Message
    setMessages(prev => [...prev, { role: 'ai', content: '...', isLoading: true }]);

    const promptText = `You are a helpful AI assistant. Answer the following request concisely and use HTML formatting (<h2> for headers, <p> for paragraphs, <ul> for lists). Request: "${currentTopic}"`;

    try {
      const response = await fetch(OLLAMA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: promptText,
          stream: false,
          options: { temperature: 0.7, num_ctx: 4096 }
        }),
      });

      if (!response.ok) throw new Error("Ollama API Error");

      const result = await response.json();
      let aiText = result.response;
      
      // Clean markdown code blocks if any
      aiText = aiText.replace(/```html/g, '').replace(/```/g, '');

      // 3. Update AI Message
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'ai', content: aiText, isLoading: false };
        return newMsgs;
      });

    } catch (err) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'ai', content: "Error: Could not connect to local Ollama.", isLoading: false, isError: true };
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div style={{paddingBottom: '20px', paddingLeft: '10px'}}>
           <MenuIcon />
        </div>
        
        <button className="new-chat-btn" onClick={() => setMessages([])}>
          <PlusIcon />
          <span>New Chat</span>
        </button>

        <div className="recent-chats">
          <div style={{padding: '0 16px 10px', fontSize: '0.85rem', fontWeight: '500'}}>Recent</div>
          <div className="menu-item active">
             <span style={{opacity: 0.7}}>💭</span> Blog Ideas
          </div>
          <div className="menu-item">
             <span style={{opacity: 0.7}}>💭</span> React Components
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="main-content">
        
        {/* Top Bar */}
        <div className="top-bar">
          <div className="model-selector">
            Gemini Advanced <span style={{fontSize:'10px'}}>▼</span>
          </div>
          <div className="user-profile">
            {/* Circle Avatar placeholder */}
            <div style={{width:32, height:32, borderRadius:'50%', background:'var(--brand-gradient)'}}></div>
          </div>
        </div>

        {/* Dynamic Content Switch */}
        {messages.length === 0 ? (
          <div className="welcome-container">
            <div className="greet-text">
              <span className="gradient-text">Hello, Developer</span>
              <span style={{color: '#444746'}}>How can I help today?</span>
            </div>
            
            {/* Quick Suggestions Cards could go here */}
          </div>
        ) : (
          <div className="chat-feed">
            {messages.map((msg, idx) => (
              <div key={idx} className="message-row">
                <div className="message-avatar">
                  {msg.role === 'user' ? 
                    <div style={{width:28, height:28, borderRadius:'50%', background:'#fff', color:'#000', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>U</div> 
                    : 
                    <SparkleIcon />
                  }
                </div>
                <div className="message-content">
                  {msg.isLoading ? (
                    <div className="gemini-loader"></div>
                  ) : (
                    msg.role === 'ai' ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      <p>{msg.content}</p>
                    )
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* INPUT BAR */}
        <div className="input-area">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              placeholder="Enter a prompt here"
              rows={1}
              value={topic}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
            />
            <button 
              className={`submit-btn ${topic.trim() ? 'has-text' : ''}`} 
              onClick={handleSend}
              disabled={loading || !topic.trim()}
            >
              <SendIcon />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;