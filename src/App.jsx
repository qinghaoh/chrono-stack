import { useState } from 'react';
import Timeline from './components/Timeline';
import { parseTimelineData } from './utils/timelineParser';
import './App.css';

const DEFAULT_DATA = '新:9 - 25,东汉:25 - 220,魏:220 - 266,蜀:221 - 263,吴:222 - 280';

const RESOLUTION_FORMATS = {
  year: 'Name:2020 - 2021',
  month: 'Name:2020-01 - 2021-12',
  day: 'Name:2020-01-15 - 2021-03-20',
};

const RESOLUTION_PLACEHOLDERS = {
  year: '新:9 - 25,东汉:25 - 220,魏:220 - 266',
  month: 'Project A:2020-01 - 2020-06,Project B:2020-04 - 2020-09',
  day: 'Sprint 1:2020-01-01 - 2020-01-14,Sprint 2:2020-01-15 - 2020-01-28',
};

function App() {
  const [input, setInput] = useState(DEFAULT_DATA);
  const [resolution, setResolution] = useState('year');
  const [events, setEvents] = useState(parseTimelineData(DEFAULT_DATA, 'year'));

  const handleVisualize = () => {
    const parsed = parseTimelineData(input, resolution);
    setEvents(parsed);
  };

  const handleResolutionChange = (newResolution) => {
    setResolution(newResolution);
    // Re-parse with new resolution if we have input
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>ChronoStack Timeline Visualizer</h1>
        <p className="subtitle">Visualize historical events on an interactive timeline</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="input-header">
            <label htmlFor="timeline-input" className="input-label">
              Timeline Data
              <span className="input-hint">
                Format: {RESOLUTION_FORMATS[resolution]}
              </span>
            </label>
            <div className="resolution-selector">
              <label htmlFor="resolution" className="resolution-label">
                Resolution:
              </label>
              <select
                id="resolution"
                className="resolution-select"
                value={resolution}
                onChange={(e) => handleResolutionChange(e.target.value)}
              >
                <option value="year">Year</option>
                <option value="month">Month</option>
                <option value="day">Day</option>
              </select>
            </div>
          </div>
          <textarea
            id="timeline-input"
            className="timeline-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={RESOLUTION_PLACEHOLDERS[resolution]}
            rows={5}
          />
          <div className="button-group">
            <button className="btn btn-primary" onClick={handleVisualize}>
              Visualize Timeline
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setInput('');
                setEvents([]);
              }}
            >
              Clear
            </button>
          </div>
          <p className="keyboard-hint">
            Tip: Press <kbd>Ctrl + Enter</kbd> to visualize
          </p>
        </div>

        <div className="visualization-section">
          <Timeline events={events} resolution={resolution} />
        </div>

        <div className="examples-section">
          <h3>Example Datasets - Auto Layering</h3>
          <p className="examples-hint">
            Events automatically distributed across layers based on time overlaps
          </p>

          {resolution === 'year' && (
            <div className="example-buttons">
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = '新:9 - 25,东汉:25 - 220,魏:220 - 266,蜀:221 - 263,吴:222 - 280';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'year'));
                }}
              >
                Chinese Dynasties
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Renaissance:1300 - 1600,Age of Discovery:1400 - 1600,Reformation:1517 - 1648,Enlightenment:1685 - 1815,Industrial Revolution:1760 - 1840';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'year'));
                }}
              >
                European Periods
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Stone Age:3000000 - 3000,Bronze Age:3300 - 1200,Iron Age:1200 - 500,Classical Antiquity:800 - 500,Middle Ages:500 - 1500';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'year'));
                }}
              >
                Historical Ages
              </button>
            </div>
          )}

          {resolution === 'month' && (
            <div className="example-buttons">
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Q1 Planning:2024-01 - 2024-03,Q1 Execution:2024-02 - 2024-04,Q2 Planning:2024-04 - 2024-06,Q2 Execution:2024-05 - 2024-07';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'month'));
                }}
              >
                Project Quarters
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Winter:2024-12 - 2025-02,Spring:2025-03 - 2025-05,Summer:2025-06 - 2025-08,Autumn:2025-09 - 2025-11';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'month'));
                }}
              >
                Seasons 2024-2025
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Phase 1:2024-01 - 2024-04,Phase 2:2024-03 - 2024-07,Phase 3:2024-06 - 2024-10,Phase 4:2024-09 - 2024-12';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'month'));
                }}
              >
                Project Phases
              </button>
            </div>
          )}

          {resolution === 'day' && (
            <div className="example-buttons">
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Sprint 1:2024-01-01 - 2024-01-14,Sprint 2:2024-01-15 - 2024-01-28,Sprint 3:2024-01-29 - 2024-02-11,Sprint 4:2024-02-12 - 2024-02-25';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'day'));
                }}
              >
                Sprints
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Design:2024-01-01 - 2024-01-10,Development:2024-01-08 - 2024-01-25,Testing:2024-01-20 - 2024-01-31,Deployment:2024-01-28 - 2024-02-02';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'day'));
                }}
              >
                Development Cycle
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Week 1:2024-01-01 - 2024-01-07,Week 2:2024-01-08 - 2024-01-14,Week 3:2024-01-15 - 2024-01-21,Week 4:2024-01-22 - 2024-01-28';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'day'));
                }}
              >
                Weekly Schedule
              </button>
            </div>
          )}
        </div>

        <div className="examples-section">
          <h3>Example Datasets - Fixed Layering</h3>
          <p className="examples-hint">
            Each category gets a dedicated layer. Format: <code>Category|Name:Start - End</code>
          </p>

          {resolution === 'year' && (
            <div className="example-buttons">
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = '秦|孝公:-361 - -338,秦|惠文王:-337 - -311,秦|武王:-310 - -307,秦|昭襄王:-306 - -251,秦|孝文王:-250 - -250,秦|庄襄王:-249 - -247,秦|始皇:-246 - -210,楚|威王:-339 - -329,楚|怀王:-328 - -299,楚|顷襄王:-298 - -263,楚|考烈王:-262 - -238,楚|幽王:-237 - -228,楚|哀王:-227 - -227,楚|负刍:-226 - -223,齐|威王:-356 - -320,齐|宣王:-319 - -301,齐|湣王:-300 - -284,齐|襄王:-283 - -265,齐|建王:-264 - -221';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'year'));
                }}
              >
                Warring States Rulers (秦楚齐)
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'USA|Washington:1789 - 1797,USA|Adams:1797 - 1801,USA|Jefferson:1801 - 1809,USA|Madison:1809 - 1817,France|Louis XVI:1774 - 1792,France|Napoleon:1804 - 1814,France|Louis XVIII:1814 - 1824,UK|George III:1760 - 1820,UK|George IV:1820 - 1830,UK|William IV:1830 - 1837';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'year'));
                }}
              >
                World Leaders 1760-1840
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Frontend|React Development:2020 - 2021,Frontend|Vue Migration:2021 - 2022,Frontend|UI Redesign:2022 - 2023,Backend|API v1:2020 - 2021,Backend|Database Migration:2021 - 2021,Backend|API v2:2021 - 2023,DevOps|CI/CD Setup:2020 - 2020,DevOps|Cloud Migration:2021 - 2022,DevOps|Monitoring:2022 - 2023';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'year'));
                }}
              >
                Project Teams 2020-2023
              </button>
            </div>
          )}

          {resolution === 'month' && (
            <div className="example-buttons">
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Product|Feature A:2024-01 - 2024-03,Product|Feature B:2024-04 - 2024-06,Product|Feature C:2024-07 - 2024-09,Marketing|Campaign 1:2024-02 - 2024-04,Marketing|Campaign 2:2024-05 - 2024-07,Sales|Q1 Push:2024-01 - 2024-03,Sales|Q2 Push:2024-04 - 2024-06,Sales|Q3 Push:2024-07 - 2024-09';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'month'));
                }}
              >
                Department Initiatives
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Alice|Project Alpha:2024-01 - 2024-04,Alice|Project Beta:2024-05 - 2024-08,Bob|Project Gamma:2024-02 - 2024-06,Bob|Project Delta:2024-07 - 2024-10,Charlie|Project Epsilon:2024-01 - 2024-03,Charlie|Project Zeta:2024-04 - 2024-09';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'month'));
                }}
              >
                Team Member Projects
              </button>
            </div>
          )}

          {resolution === 'day' && (
            <div className="example-buttons">
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Team A|Sprint 1:2024-01-01 - 2024-01-14,Team A|Sprint 2:2024-01-15 - 2024-01-28,Team B|Sprint 1:2024-01-08 - 2024-01-21,Team B|Sprint 2:2024-01-22 - 2024-02-04,Team C|Sprint 1:2024-01-01 - 2024-01-14,Team C|Sprint 2:2024-01-15 - 2024-01-28';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'day'));
                }}
              >
                Multi-Team Sprints
              </button>
              <button
                className="btn btn-example"
                onClick={() => {
                  const data = 'Room A|Meeting 1:2024-01-15 - 2024-01-15,Room A|Meeting 2:2024-01-16 - 2024-01-16,Room A|Meeting 3:2024-01-17 - 2024-01-17,Room B|Conference:2024-01-15 - 2024-01-17,Room C|Workshop 1:2024-01-15 - 2024-01-16,Room C|Workshop 2:2024-01-18 - 2024-01-19';
                  setInput(data);
                  setEvents(parseTimelineData(data, 'day'));
                }}
              >
                Room Bookings
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Created with React + Vite | Data format: Name:StartYear - EndYear</p>
      </footer>
    </div>
  );
}

export default App;
