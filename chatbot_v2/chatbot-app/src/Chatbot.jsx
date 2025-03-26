import React, { useState, useEffect, useRef } from 'react';
import InitialSetupModal from './InitialSetupModal';
import AdditionalQuestionsModal from './AdditionalQuestionsModal';
import './Chatbot.css';
import ReactMarkdown from 'react-markdown';

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function Modal({ isOpen, onClose, content, title, className = '' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className={`modal ${className}`}>
        {title && <h3>{title}</h3>}
        <div className="modal-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

function FeedbackModal({ isOpen, onClose, onSubmit, language }) {
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);

  const text = {
    en: {
      title: "Feedback",
      label: "Your Feedback:",
      submit: "Submit",
    },
    de: {
      title: "Feedback",
      label: "Ihr Feedback:",
      submit: "Abschicken",
    }
  };

  const ft = text[language] || text.en;

  const handleStarClick = (star) => {
    setRating(star);
  };

  const handleSubmit = () => {
    onSubmit({ feedback_text: feedbackText, rating });
    setFeedbackText('');
    setRating(0);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h3>{ft.title}</h3>
        <div className="modal-content">
          <label>
            {ft.label}
            <textarea 
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows="4"
              style={{ width: '100%' }}
            />
          </label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? 'selected' : ''}`}
                onClick={() => handleStarClick(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handleSubmit} className="submit-button">{ft.submit}</button>
        </div>
      </div>
    </div>
  );
}

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('de');
  const [config, setConfig] = useState(null);
  const [impressumContent, setImpressumContent] = useState('');
  const [isImpressumOpen, setIsImpressumOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // For initial setup modal
  const [initialSetupDone, setInitialSetupDone] = useState(false);
  const [initialSetup, setInitialSetup] = useState({
    proficiency: null,
    condition: null,
    language: 'de',
    consent_given: false
  });

  // For additional questions modal (triggered after 3 user messages)
  const [additionalModalCompleted, setAdditionalModalCompleted] = useState(false);
  const [showAdditionalModal, setShowAdditionalModal] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (initialSetupDone && !conversationId) {
      setLoading(true);
      setLanguage(initialSetup.language);
      const payload = {
        proficiency: initialSetup.proficiency,
        consent_given: initialSetup.consent_given,
        language: initialSetup.language,
        usecase_specific_info: { solar_panel_ownership: initialSetup.condition }
      };
      fetch('/api/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          setConversationId(data.conversation_id);
          setMessages([{ role: 'assistant', content: data.initial_message }]);
        })
        .catch((err) => console.error('Error during init:', err))
        .finally(() => setLoading(false));
    }
  }, [initialSetupDone, conversationId, initialSetup]);

  const handleInitialSetupSubmit = (setupData) => {
    setInitialSetup(setupData);
    setInitialSetupDone(true);
  };

  const openImpressum = () => {
    const path = language === 'en' ? '/impressum_chatbot_en.md' : '/impressum_chatbot_de.md';
    fetch(path)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        setImpressumContent(text);
        setIsImpressumOpen(true);
      })
      .catch((err) => console.error('Error fetching impressum:', err));
  };

  const handleSend = async () => {
    if (!conversationId) return;
    if (input.trim() === '') return;
    const newUserMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: newUserMsg.content,
          history: [...messages, newUserMsg],
          language,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error during chat request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = (feedbackData) => {
    if (!conversationId) return;
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        feedback_text: feedbackData.feedback_text,
        rating: feedbackData.rating,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log('Feedback submitted:', data))
      .catch((err) => console.error(err));
  };

  // Trigger additional questions modal after exactly 3 user messages
  useEffect(() => {
    const userMsgCount = messages.filter((msg) => msg.role === 'user' && msg.content.trim() !== "").length;
    if (userMsgCount === 3 && !additionalModalCompleted) {
      setShowAdditionalModal(true);
    }
  }, [messages, additionalModalCompleted]);

  // When additional questions modal is submitted,
  // update usecase-specific info and add a thank-you message from the chatbot.
  const handleAdditionalQuestionsSubmit = async ({ additionalInfo, writtenFeedback }) => {
    try {
      const res = await fetch('/api/update_usecase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          additional_info: additionalInfo
        }),
      });
      const updateData = await res.json();
      console.log("Usecase info updated:", updateData.updated_info);
    } catch (error) {
      console.error("Error updating usecase info:", error);
    }
    if (writtenFeedback.trim() !== '') {
      handleFeedbackSubmit({ feedback_text: writtenFeedback, rating: null });
    }
    // Add a thank-you message from the chatbot after the additional questions are submitted.
    const thanksMessage =
      language === 'en'
        ? "Apologies for the interruptions and thank you for the answers! Let us continue our discussion."
        : "Entschuldigung für die Unterbrechnung und Vielen Dank für die Antworten! Lassen Sie uns die Diskussion fortsetzen.";
    setMessages((prev) => [...prev, { role: 'assistant', content: thanksMessage }]);
    setAdditionalModalCompleted(true);
    setShowAdditionalModal(false);
  };

  if (!initialSetupDone) {
    return (
      <div className="chat-app">
        <InitialSetupModal isOpen={!initialSetupDone} onSubmit={handleInitialSetupSubmit} />
      </div>
    );
  }

  const user_selection = initialSetup.condition === 'yes' ? 'yes' : 'no';
  let additionalQuestions = [];
  if (config && config.background_questions && config.background_questions[user_selection] && config.background_questions[user_selection].user_feedback_questions) {
    additionalQuestions = [
      config.background_questions[user_selection].user_feedback_questions.q1[language],
      config.background_questions[user_selection].user_feedback_questions.q2[language]
    ];
  }

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h2>
          {config
            ? language === 'en'
              ? config.titles.front_page.en.name
              : config.titles.front_page.de.name
            : 'Loading...'}
        </h2>
      </div>
      <div className="chat-messages">
        {messages.filter(msg => msg && msg.content && msg.content.trim() !== "").length === 0 && loading ? (
          <div className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        ) : (
          messages
            .filter(msg => msg && msg.content && msg.content.trim() !== "")
            .map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${msg.role}`}
                style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}
              >
                {msg.content}
              </div>
            ))
        )}
        {messages.filter(msg => msg && msg.content && msg.content.trim() !== "").length > 0 && loading && (
          <div className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          placeholder={
            language === 'en'
              ? "Type your message..."
              : "Geben Sie Ihre Nachricht ein..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          {language === 'en' ? "Send" : "Senden"}
        </button>
      </div>
      <div className="chat-disclaimer">
        {config &&
          (language === 'en'
            ? config.disclaimer_en
            : config.disclaimer_de)}
      </div>
      <div className="chat-footer">
        <div className="footer-links">
          <span className="footer-link" onClick={openImpressum}>
            Impressum
          </span>
          <span className="footer-link" onClick={() => setIsFeedbackOpen(true)}>
            Feedback
          </span>
        </div>
      </div>
      <AdditionalQuestionsModal
        isOpen={showAdditionalModal}
        onClose={() => setShowAdditionalModal(false)}
        questions={additionalQuestions}
        language={language}
        onSubmit={handleAdditionalQuestionsSubmit}
      />
      <Modal
        isOpen={isImpressumOpen}
        onClose={() => setIsImpressumOpen(false)}
        content={impressumContent}
        title=""
        className="impressum"
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
        language={language}
      />
    </div>
  );
}

export default Chatbot;
