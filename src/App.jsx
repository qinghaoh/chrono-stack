import { useState } from 'react';
import Timeline from './components/Timeline';
import { parseTimelineData } from './utils/timelineParser';
import { useLanguage } from './i18n/LanguageContext';
import examplesData from './data/examples.json';
import './App.css';

const { defaultData, resolutionFormats, resolutionPlaceholders, examples } = examplesData;

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [input, setInput] = useState(defaultData);
  const [resolution, setResolution] = useState('year');
  const [orientation, setOrientation] = useState('horizontal');
  const [theme, setTheme] = useState('colorful');
  const [events, setEvents] = useState(parseTimelineData(defaultData, 'year'));

  const handleVisualize = () => {
    const parsed = parseTimelineData(input, resolution);
    setEvents(parsed);
  };

  const handleResolutionChange = (newResolution) => {
    setResolution(newResolution);
    if (input) {
      const parsed = parseTimelineData(input, newResolution);
      setEvents(parsed);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleVisualize();
    }
  };

  const handleExampleClick = (data) => {
    setInput(data);
    setEvents(parseTimelineData(data, resolution));
  };

  const renderExampleButtons = (exampleList) => (
    <div className="example-buttons">
      {exampleList.map((example, index) => (
        <button
          key={index}
          className="btn btn-example"
          onClick={() => handleExampleClick(example.data)}
        >
          {t(example.labelKey)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('appTitle')}</h1>
        <p className="subtitle">{t('appSubtitle')}</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="input-header">
            <label htmlFor="timeline-input" className="input-label">
              {t('timelineData')}
              <span className="input-hint">
                {t('formatHint')}: {resolutionFormats[resolution]}
              </span>
            </label>
            <div className="controls-group">
              <div className="resolution-selector">
                <label htmlFor="resolution" className="resolution-label">
                  {t('resolution')}:
                </label>
                <select
                  id="resolution"
                  className="resolution-select"
                  value={resolution}
                  onChange={(e) => handleResolutionChange(e.target.value)}
                >
                  <option value="year">{t('year')}</option>
                  <option value="month">{t('month')}</option>
                  <option value="day">{t('day')}</option>
                </select>
              </div>
              <div className="orientation-selector">
                <label htmlFor="orientation" className="orientation-label">
                  {t('orientation')}:
                </label>
                <select
                  id="orientation"
                  className="orientation-select"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  <option value="horizontal">{t('horizontal')}</option>
                  <option value="vertical">{t('vertical')}</option>
                </select>
              </div>
              <div className="theme-selector">
                <label htmlFor="theme" className="theme-label">
                  {t('theme')}:
                </label>
                <select
                  id="theme"
                  className="theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="colorful">{t('colorful')}</option>
                  <option value="classic">{t('classic')}</option>
                </select>
              </div>
              <div className="language-selector">
                <label htmlFor="language" className="language-label">
                  {t('language')}:
                </label>
                <select
                  id="language"
                  className="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">{t('english')}</option>
                  <option value="zh-TW">{t('traditionalChinese')}</option>
                  <option value="zh-CN">{t('simplifiedChinese')}</option>
                </select>
              </div>
            </div>
          </div>
          <textarea
            id="timeline-input"
            className="timeline-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={resolutionPlaceholders[resolution]}
            rows={5}
          />
          <div className="button-group">
            <button className="btn btn-primary" onClick={handleVisualize}>
              {t('visualizeButton')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setInput('');
                setEvents([]);
              }}
            >
              {t('clearButton')}
            </button>
          </div>
          <p className="keyboard-hint">
            {t('keyboardHint')} <kbd>Ctrl + Enter</kbd> {t('toVisualize')}
          </p>
        </div>

        <div className="visualization-section">
          <Timeline events={events} resolution={resolution} orientation={orientation} theme={theme} />
        </div>

        <div className="examples-section">
          <h3>{t('examplesAutoTitle')}</h3>
          <p className="examples-hint">
            {t('examplesAutoHint')}
          </p>
          {examples.auto[resolution] && renderExampleButtons(examples.auto[resolution])}
        </div>

        <div className="examples-section">
          <h3>{t('examplesFixedTitle')}</h3>
          <p className="examples-hint">
            {t('examplesFixedHint')} <code>Category|Name:Start - End</code>
          </p>
          {examples.fixed[resolution] && renderExampleButtons(examples.fixed[resolution])}
        </div>
      </main>

      <footer className="app-footer">
        <p>{t('footerText')} | {t('dataFormat')}: Name:StartYear - EndYear</p>
      </footer>
    </div>
  );
}

export default App;
