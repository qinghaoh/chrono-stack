import { useMemo } from 'react';
import { processEvents, getTimeRange, formatTimeValue, getCategoryLabels, getFootnotes } from '../utils/timelineParser';
import { useLanguage } from '../i18n/LanguageContext';
import './Timeline.css';

const COLORFUL_THEME = {
  colors: [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
  ],
  textColor: '#fff',
  stroke: '#fff',
};

const CLASSIC_THEME = {
  colors: [
    '#dbeafe', // light blue
    '#fee2e2', // light red
    '#d1fae5', // light green
    '#fef3c7', // light amber
    '#ede9fe', // light purple
    '#fce7f3', // light pink
    '#cffafe', // light cyan
    '#fed7aa', // light orange
    '#ecfccb', // light lime
    '#e0e7ff', // light indigo
  ],
  textColor: '#1f2937',
  stroke: '#9ca3af',
};

// Helper function to estimate text width in pixels
function estimateTextWidth(text, fontSize = 14, fontWeight = 'normal') {
  // Approximate character width ratios (relative to fontSize)
  const avgCharWidth = fontSize * 0.6; // Average for proportional fonts
  const chineseCharWidth = fontSize * 1.0; // Chinese chars are wider

  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Check if character is Chinese/Japanese/Korean
    if (char.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/)) {
      totalWidth += chineseCharWidth;
    } else {
      totalWidth += avgCharWidth;
    }
  }

  if (fontWeight === 'bold') {
    totalWidth *= 1.1; // Bold text is slightly wider
  }

  return totalWidth;
}

// Helper function to split text into lines (max chars per line)
function splitTextIntoLines(text, maxCharsPerLine = 5) {
  const lines = [];
  for (let i = 0; i < text.length; i += maxCharsPerLine) {
    lines.push(text.slice(i, i + maxCharsPerLine));
  }
  return lines;
}

// Calculate label box dimensions based on text content
function calculateLabelDimensions(labels, fontSize = 13, maxCharsPerLine = 5) {
  let maxLines = 1;

  for (const [, label] of labels) {
    const lines = splitTextIntoLines(label, maxCharsPerLine);
    maxLines = Math.max(maxLines, lines.length);
  }

  // Width: max chars * char width + padding
  const charWidth = fontSize * 1.0; // Chinese char width
  const boxWidth = maxCharsPerLine * charWidth + 20; // 10px padding on each side

  // Height: lines * line height + padding
  const lineHeight = fontSize * 1.4;
  const boxHeight = maxLines * lineHeight + 16; // 8px padding on top and bottom

  return { boxWidth, boxHeight, maxLines };
}

function Timeline({ events, resolution = 'year', orientation = 'horizontal', theme = 'colorful' }) {
  const { t } = useLanguage();
  const layeredEvents = useMemo(() => processEvents(events), [events]);
  const timeRange = useMemo(() => getTimeRange(layeredEvents), [layeredEvents]);
  const categoryLabels = useMemo(() => getCategoryLabels(layeredEvents), [layeredEvents]);
  const footnotes = useMemo(() => getFootnotes(layeredEvents), [layeredEvents]);
  const themeConfig = theme === 'classic' ? CLASSIC_THEME : COLORFUL_THEME;

  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        {t('emptyState')}
      </div>
    );
  }

  if (orientation === 'vertical') {
    return <TimelineVertical
      layeredEvents={layeredEvents}
      timeRange={timeRange}
      categoryLabels={categoryLabels}
      footnotes={footnotes}
      resolution={resolution}
      themeConfig={themeConfig}
    />;
  }

  return <TimelineHorizontal
    layeredEvents={layeredEvents}
    timeRange={timeRange}
    categoryLabels={categoryLabels}
    footnotes={footnotes}
    resolution={resolution}
    themeConfig={themeConfig}
  />;
}

function TimelineHorizontal({ layeredEvents, timeRange, categoryLabels, footnotes, resolution, themeConfig }) {
  const numLayers = Math.max(...layeredEvents.map(e => e.layer), 0) + 1;
  const hasCategories = categoryLabels.size > 0;
  const hasFootnotes = footnotes && footnotes.length > 0;

  // Calculate adaptive label dimensions
  const labelDims = hasCategories ? calculateLabelDimensions(categoryLabels, 13, 5) : { boxWidth: 0, boxHeight: 50 };
  const leftPadding = hasCategories ? labelDims.boxWidth + 20 : 60;
  const padding = 60;
  const layerHeight = Math.max(60, labelDims.boxHeight + 10);

  // Add space for footnotes if present
  const footnoteHeight = hasFootnotes ? footnotes.length * 22 + 40 : 0;
  const height = numLayers * layerHeight + padding * 2 + footnoteHeight;
  const timeSpan = timeRange.max - timeRange.min;

  // Calculate minimum width needed for each event (using visual positions)
  let minPixelsPerTimeUnit = 0;
  for (const event of layeredEvents) {
    const visualStart = event.visualStart !== undefined ? event.visualStart : event.start;
    const visualEnd = event.visualEnd !== undefined ? event.visualEnd : event.end;
    const eventDuration = visualEnd - visualStart;
    if (eventDuration <= 0) continue;

    // Calculate minimum width needed for this event's text
    const nameWidth = estimateTextWidth(event.name, 14, 'bold');
    const dateStr = `(${event.startStr || formatTimeValue(event.start, resolution)} - ${event.endStr || formatTimeValue(event.end, resolution)})`;
    const dateWidth = estimateTextWidth(dateStr, 11);
    const textWidth = Math.max(nameWidth, dateWidth);

    // Add padding (20px on each side)
    const minEventWidth = textWidth + 40;

    // Calculate pixels per time unit needed for this event
    const pixelsPerTimeUnit = minEventWidth / eventDuration;
    minPixelsPerTimeUnit = Math.max(minPixelsPerTimeUnit, pixelsPerTimeUnit);
  }

  // Set absolute minimum (safety floor only)
  const MIN_PIXELS_PER_UNIT = 2;
  const pixelsPerTimeUnit = Math.max(MIN_PIXELS_PER_UNIT, minPixelsPerTimeUnit);

  // Calculate dynamic width
  const timelineWidth = timeSpan * pixelsPerTimeUnit;
  const width = timelineWidth + leftPadding + padding;

  const timeToX = (time) => {
    return leftPadding + ((time - timeRange.min) / timeSpan) * timelineWidth;
  };

  // Calculate time markers
  const timeMarkers = [];
  const markerInterval = Math.max(1, Math.ceil(timeSpan / 10));

  // For negative ranges, Math.floor gives us a marker at or before the min
  // For positive ranges, Math.ceil gives us a marker at or after the min
  let firstMarker;
  if (timeRange.min < 0) {
    firstMarker = Math.floor(timeRange.min / markerInterval) * markerInterval;
  } else {
    firstMarker = Math.ceil(timeRange.min / markerInterval) * markerInterval;
  }

  for (let time = firstMarker; time <= timeRange.max; time += markerInterval) {
    timeMarkers.push(time);
  }

  return (
    <div className="timeline-container timeline-horizontal-scroll">
      <svg width={width} height={height} className="timeline-svg">
        {/* Category labels */}
        {hasCategories && Array.from(categoryLabels.entries()).map(([layerIndex, label]) => {
          const lines = splitTextIntoLines(label, 5);
          const lineHeight = 13 * 1.4;
          const textStartY = padding + layerIndex * layerHeight + (layerHeight - 10) / 2 - (lines.length - 1) * lineHeight / 2;

          return (
            <g key={`label-${layerIndex}`}>
              <rect
                x={10}
                y={padding + layerIndex * layerHeight}
                width={labelDims.boxWidth}
                height={layerHeight - 10}
                fill="#f3f4f6"
                stroke="#d1d5db"
                strokeWidth="1"
                rx="4"
              />
              <text
                x={10 + labelDims.boxWidth / 2}
                y={textStartY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="600"
                fill="#374151"
                className="category-label"
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={10 + labelDims.boxWidth / 2} dy={i === 0 ? 0 : lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Time axis */}
        <line
          x1={leftPadding}
          y1={height - padding / 2}
          x2={width - padding}
          y2={height - padding / 2}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Time markers */}
        {timeMarkers.map(time => (
          <g key={time}>
            <line
              x1={timeToX(time)}
              y1={height - padding / 2}
              x2={timeToX(time)}
              y2={height - padding / 2 + 10}
              stroke="#333"
              strokeWidth="2"
            />
            <text
              x={timeToX(time)}
              y={height - padding / 2 + 25}
              textAnchor="middle"
              fontSize="14"
              fill="#333"
            >
              {formatTimeValue(time, resolution)}
            </text>
          </g>
        ))}

        {/* Timeline events */}
        {layeredEvents.map((event, index) => {
          // Use visual positions for rendering, but original values for display
          const visualStart = event.visualStart !== undefined ? event.visualStart : event.start;
          const visualEnd = event.visualEnd !== undefined ? event.visualEnd : event.end;
          const x = timeToX(visualStart);
          const eventWidth = timeToX(visualEnd) - x;
          const y = padding + event.layer * layerHeight;
          const color = themeConfig.colors[index % themeConfig.colors.length];

          return (
            <g key={`${event.name}-${index}`}>
              <title>{event.name}&#10;({event.startStr || formatTimeValue(event.start, resolution)} - {event.endStr || formatTimeValue(event.end, resolution)}){event.note ? `\n[${event.noteIndex}] ${event.note}` : ''}</title>
              <rect
                x={x}
                y={y}
                width={eventWidth}
                height={layerHeight - 10}
                fill={color}
                stroke={themeConfig.stroke}
                strokeWidth="2"
                rx="4"
                className="timeline-event"
              />
              <text
                x={x + eventWidth / 2}
                y={y + layerHeight / 2 - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={themeConfig.textColor}
                fontSize="14"
                fontWeight="bold"
                className="timeline-text"
              >
                {event.name}{event.noteIndex ? ` [${event.noteIndex}]` : ''}
              </text>
              <text
                x={x + eventWidth / 2}
                y={y + layerHeight / 2 + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={themeConfig.textColor}
                fontSize="11"
                className="timeline-text"
              >
                ({event.startStr || formatTimeValue(event.start, resolution)} - {event.endStr || formatTimeValue(event.end, resolution)})
              </text>
            </g>
          );
        })}

        {/* Footnotes section */}
        {hasFootnotes && (
          <g className="footnotes-section">
            <line
              x1={leftPadding}
              y1={numLayers * layerHeight + padding + 20}
              x2={width - padding}
              y2={numLayers * layerHeight + padding + 20}
              stroke="#d1d5db"
              strokeWidth="1"
            />
            {footnotes.map((footnote, idx) => (
              <text
                key={footnote.index}
                x={leftPadding}
                y={numLayers * layerHeight + padding + 45 + idx * 22}
                fontSize="12"
                fill="#374151"
                className="footnote-text"
              >
                [{footnote.index}] {footnote.name}: {footnote.note}
              </text>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

function TimelineVertical({ layeredEvents, timeRange, categoryLabels, footnotes, resolution, themeConfig }) {
  const numLayers = Math.max(...layeredEvents.map(e => e.layer), 0) + 1;
  const hasCategories = categoryLabels.size > 0;
  const hasFootnotes = footnotes && footnotes.length > 0;

  // Calculate adaptive label dimensions for vertical layout
  const labelDims = hasCategories ? calculateLabelDimensions(categoryLabels, 13, 5) : { boxWidth: 70, boxHeight: 50 };
  const topPadding = hasCategories ? labelDims.boxHeight + 20 : 60;
  const padding = 100; // Increased from 60 to 100 to prevent negative sign clipping
  const layerWidth = Math.max(80, labelDims.boxWidth + 10);

  // Add space for footnotes on the right side if present
  const footnoteWidth = hasFootnotes ? 350 : 0;
  const width = numLayers * layerWidth + padding * 2 + footnoteWidth;
  const timeSpan = timeRange.max - timeRange.min;

  // Calculate minimum height needed for each event (using visual positions)
  let minPixelsPerTimeUnit = 0;
  for (const event of layeredEvents) {
    const visualStart = event.visualStart !== undefined ? event.visualStart : event.start;
    const visualEnd = event.visualEnd !== undefined ? event.visualEnd : event.end;
    const eventDuration = visualEnd - visualStart;
    if (eventDuration <= 0) continue;

    // For vertical layout, we need space for:
    // - Event name at top (20px)
    // - Two date lines at bottom (20px + 12px)
    // - Minimum padding between them (20px)
    const minEventHeight = 80; // Minimum readable height

    // Calculate pixels per time unit needed for this event
    const pixelsPerTimeUnit = minEventHeight / eventDuration;
    minPixelsPerTimeUnit = Math.max(minPixelsPerTimeUnit, pixelsPerTimeUnit);
  }

  // Set absolute minimum (safety floor only)
  const MIN_PIXELS_PER_UNIT = 1;
  const pixelsPerTimeUnit = Math.max(MIN_PIXELS_PER_UNIT, minPixelsPerTimeUnit);

  // Calculate dynamic height
  const timelineHeight = timeSpan * pixelsPerTimeUnit;
  const height = timelineHeight + topPadding + padding;

  const timeToY = (time) => {
    return topPadding + ((time - timeRange.min) / timeSpan) * timelineHeight;
  };

  // Calculate time markers
  const timeMarkers = [];
  const markerInterval = Math.max(1, Math.ceil(timeSpan / 10));

  // For negative ranges, Math.floor gives us a marker at or before the min
  // For positive ranges, Math.ceil gives us a marker at or after the min
  let firstMarker;
  if (timeRange.min < 0) {
    firstMarker = Math.floor(timeRange.min / markerInterval) * markerInterval;
  } else {
    firstMarker = Math.ceil(timeRange.min / markerInterval) * markerInterval;
  }

  for (let time = firstMarker; time <= timeRange.max; time += markerInterval) {
    timeMarkers.push(time);
  }

  return (
    <div className="timeline-container">
      <svg width={width} height={height} className="timeline-svg">
        {/* Category labels (at top) */}
        {hasCategories && Array.from(categoryLabels.entries()).map(([layerIndex, label]) => {
          const lines = splitTextIntoLines(label, 5);
          const lineHeight = 13 * 1.4;
          const boxX = padding + layerIndex * layerWidth;
          const boxY = 10;
          const boxW = layerWidth - 10;
          const boxH = labelDims.boxHeight;
          const textStartY = boxY + boxH / 2 - (lines.length - 1) * lineHeight / 2;

          return (
            <g key={`label-${layerIndex}`}>
              <rect
                x={boxX}
                y={boxY}
                width={boxW}
                height={boxH}
                fill="#f3f4f6"
                stroke="#d1d5db"
                strokeWidth="1"
                rx="4"
              />
              <text
                x={boxX + boxW / 2}
                y={textStartY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="600"
                fill="#374151"
                className="category-label"
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={boxX + boxW / 2} dy={i === 0 ? 0 : lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Time axis (vertical) */}
        <line
          x1={padding / 2}
          y1={topPadding}
          x2={padding / 2}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Time markers */}
        {timeMarkers.map(time => (
          <g key={time}>
            <line
              x1={padding / 2 - 10}
              y1={timeToY(time)}
              x2={padding / 2}
              y2={timeToY(time)}
              stroke="#333"
              strokeWidth="2"
            />
            <text
              x={padding / 2 - 15}
              y={timeToY(time)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="14"
              fill="#333"
            >
              {formatTimeValue(time, resolution)}
            </text>
          </g>
        ))}

        {/* Timeline events */}
        {layeredEvents.map((event, index) => {
          // Use visual positions for rendering, but original values for display
          const visualStart = event.visualStart !== undefined ? event.visualStart : event.start;
          const visualEnd = event.visualEnd !== undefined ? event.visualEnd : event.end;
          const y = timeToY(visualStart);
          const eventHeight = timeToY(visualEnd) - y;
          const x = padding + event.layer * layerWidth;
          const color = themeConfig.colors[index % themeConfig.colors.length];

          // Calculate vertical center position
          const centerY = y + eventHeight / 2;

          return (
            <g key={`${event.name}-${index}`}>
              <title>{event.name}&#10;({event.startStr || formatTimeValue(event.start, resolution)} - {event.endStr || formatTimeValue(event.end, resolution)}){event.note ? `\n[${event.noteIndex}] ${event.note}` : ''}</title>
              <rect
                x={x}
                y={y}
                width={layerWidth - 10}
                height={eventHeight}
                fill={color}
                stroke={themeConfig.stroke}
                strokeWidth="2"
                rx="4"
                className="timeline-event"
              />
              {/* Name - horizontal text */}
              <text
                x={x + (layerWidth - 10) / 2}
                y={centerY - 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={themeConfig.textColor}
                fontSize="12"
                fontWeight="bold"
                className="timeline-text"
              >
                {event.name}{event.noteIndex ? ` [${event.noteIndex}]` : ''}
              </text>
              {/* Time period - horizontal text */}
              <text
                x={x + (layerWidth - 10) / 2}
                y={centerY + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={themeConfig.textColor}
                fontSize="9"
                className="timeline-text"
              >
                ({event.startStr || formatTimeValue(event.start, resolution)} -
              </text>
              <text
                x={x + (layerWidth - 10) / 2}
                y={centerY + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={themeConfig.textColor}
                fontSize="9"
                className="timeline-text"
              >
                {event.endStr || formatTimeValue(event.end, resolution)})
              </text>
            </g>
          );
        })}

        {/* Footnotes section (on the right side) */}
        {hasFootnotes && (
          <g className="footnotes-section">
            <line
              x1={numLayers * layerWidth + padding + 20}
              y1={topPadding}
              x2={numLayers * layerWidth + padding + 20}
              y2={height - padding}
              stroke="#d1d5db"
              strokeWidth="1"
            />
            {footnotes.map((footnote, idx) => (
              <text
                key={footnote.index}
                x={numLayers * layerWidth + padding + 35}
                y={topPadding + 20 + idx * 22}
                fontSize="12"
                fill="#374151"
                className="footnote-text"
              >
                [{footnote.index}] {footnote.name}: {footnote.note}
              </text>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

export default Timeline;
