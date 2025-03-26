import React, { useState } from 'react';
import './Chatbot.css';

function InitialSetupModal({ isOpen, onSubmit }) {
  // Default language: German (Swiss flag)
  const [lang, setLang] = useState('de');
  const [sliderValue, setSliderValue] = useState(50);
  const [experience, setExperience] = useState(null); // 'yes' or 'no'
  const [consent, setConsent] = useState(false);

  // Text for each language
  const text = {
    en: {
      proficiencyLabel: "How would you rate your knowledge about solar energy? (0-100)",
      question: "Do you own a solar system?",
      consent: "I acknowledge that the data collected during this session will be securely stored and used solely for research purposes at ETH Zurich.",
      continue: "Continue",
      yes: "Yes",
      no: "No",
      noOptionSelected: "Please select an option.",
      noConsent: "You must give consent to continue."
    },
    de: {
      proficiencyLabel: "Wie würden Sie Ihr Wissen über Solarenergie einschätzen? (0-100)",
      question: "Besitzen Sie eine Solar-Anlage?",
      consent: "Ich nehme zur Kenntnis, dass die gesammelten Daten sicher gespeichert und ausschließlich für Forschungszwecke an der ETH Zürich verwendet werden.",
      continue: "Weiter",
      yes: "Ja",
      no: "Nein",
      noOptionSelected: "Bitte wählen Sie eine Option aus.",
      noConsent: "Sie müssen Ihr Einverständnis geben, um fortzufahren."
    }
  };

  const t = text[lang];

  // Convert slider value to proficiency string
  const getProficiencyString = (value) => {
    if (value <= 33) return "beginner";
    if (value <= 66) return "intermediate";
    return "expert";
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
  };

  const handleSubmit = () => {
    if (experience === null) {
      alert(t.noOptionSelected);
      return;
    }
    if (!consent) {
      alert(t.noConsent);
      return;
    }
    const proficiency = getProficiencyString(sliderValue);
    onSubmit({
      proficiency,
      solarOwnership: experience,
      language: lang,
      consent_given: consent
    });
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal initial-setup">
        <div className="modal-content">
          <div className="language-selection">
            <p className="language-label">Sprache / Language:</p>
            <span
              className={`flag ${lang === 'de' ? 'selected' : ''}`}
              onClick={() => handleLanguageChange('de')}
            >
              🇨🇭
            </span>
            <span
              className={`flag ${lang === 'en' ? 'selected' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              🇬🇧
            </span>
          </div>

          <div className="proficiency-section">
            <p className="proficiency-label">
              {t.proficiencyLabel} <span className="slider-value">({sliderValue})</span>
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
            />
          </div>

          <div className="experience-question">
            <p className="experience-label">{t.question}</p>
            <div className="ownership-buttons">
              <button
                className={experience === 'yes' ? 'selected' : ''}
                onClick={() => setExperience('yes')}
              >
                {t.yes}
              </button>
              <button
                className={experience === 'no' ? 'selected' : ''}
                onClick={() => setExperience('no')}
              >
                {t.no}
              </button>
            </div>
          </div>

          <label className="consent-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {t.consent}
          </label>
        </div>
        <div className="modal-footer">
          <button onClick={handleSubmit} className="submit-button">{t.continue}</button>
        </div>
      </div>
    </div>
  );
}

export default InitialSetupModal;
