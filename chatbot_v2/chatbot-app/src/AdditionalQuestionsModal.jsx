import React, { useState } from 'react';
import './Chatbot.css';

function AdditionalQuestionsModal({ isOpen, onClose, questions, language, onSubmit }) {
  // Expecting questions to be an array with two strings (q1 and q2 in HTML)
  const [sliderValues, setSliderValues] = useState(Array(questions.length).fill(50));
  const [writtenFeedback, setWrittenFeedback] = useState('');

  const text = {
    en: {
      title: "Before we continue – please answer the following questions:",
      submit: "Submit",
      feedbackLabel: "Got any additional comments or feedback?"
    },
    de: {
      title: "Bevor wir weitermachen – Bitte beantworten Sie folgende Fragen:",
      submit: "Abschicken",
      feedbackLabel: "Haben Sie sonstige Kommentare oder Feedback?"
    }
  };
  const t = text[language] || text.en;

  const handleSliderChange = (index, newValue) => {
    const updated = [...sliderValues];
    updated[index] = Number(newValue);
    setSliderValues(updated);
  };

  const handleSubmit = () => {
    // Build an object with keys q1, q2, etc.
    const additionalInfo = {};
    sliderValues.forEach((value, index) => {
      additionalInfo[`q${index + 1}`] = value;
    });
    onSubmit({ additionalInfo, writtenFeedback });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal additional-questions">
        <h3 className="additional-title">{t.title}</h3>
        <div className="modal-content additional-content">
          {questions.map((q, idx) => (
            <div key={idx} className="additional-question">
              <div className="question-text" dangerouslySetInnerHTML={{ __html: q }} />
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValues[idx]}
                onChange={(e) => handleSliderChange(idx, e.target.value)}
                className="slider-input"
              />
              <span className="slider-value" style={{ marginLeft: '10px' }}>{sliderValues[idx]}</span>
            </div>
          ))}
          <label className="feedback-label">
            {t.feedbackLabel}
            <textarea
              rows={4}
              style={{ width: '100%', marginTop: '5px' }}
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button onClick={handleSubmit} className="submit-button">{t.submit}</button>
        </div>
      </div>
    </div>
  );
}

export default AdditionalQuestionsModal;
