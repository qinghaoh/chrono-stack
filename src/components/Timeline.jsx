import { useMemo } from 'react';
import { calculateLayers, getTimeRange, formatTimeValue, getCategoryLabels } from '../utils/timelineParser';
import './Timeline.css';

const COLORS = [
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
];

function Timeline({ events, resolution = 'year', orientation = 'horizontal' }) {
  const layeredEvents = useMemo(() => calculateLayers(events), [events]);
  const timeRange = useMemo(() => getTimeRange(events), [events]);
  const categoryLabels = useMemo(() => getCategoryLabels(layeredEvents), [layeredEvents]);

  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        Enter timeline data to visualize
      </div>
    );
  }

  if (orientation === 'vertical') {
    return <TimelineVertical
      layeredEvents={layeredEvents}
      timeRange={timeRange}
      categoryLabels={categoryLabels}
      resolution={resolution}
    />;
  }

  return <TimelineHorizontal
    layeredEvents={layeredEvents}
    timeRange={timeRange}
    categoryLabels={categoryLabels}
    resolution={resolution}
  />;
}

function TimelineHorizontal({ layeredEvents, timeRange, categoryLabels, resolution }) {
  const numLayers = Math.max(...layeredEvents.map(e => e.layer), 0) + 1;
  const hasCategories = categoryLabels.size > 0;
  const leftPadding = hasCategories ? 120 : 60;
  const padding = 60;
  const width = 1200;
  const layerHeight = 60;
  const height = numLayers * layerHeight + padding * 2;
  const timelineWidth = width - leftPadding - padding;
  const timeSpan = timeRange.max - timeRange.min;

  const timeToX = (time) => {
    return leftPadding + ((time - timeRange.min) / timeSpan) * timelineWidth;
  };

  const timeMarkers = [];
  const markerInterval = Math.max(1, Math.ceil(timeSpan / 10));
  for (let time = Math.ceil(timeRange.min / markerInterval) * markerInterval;
       time <= timeRange.max;
       time += markerInterval) {
    timeMarkers.push(time);
  }

  return (
    <div className="timeline-container">
      <svg width={width} height={height} className="timeline-svg">
        {/* Category labels */}
        {hasCategories && Array.from(categoryLabels.entries()).map(([layerIndex, label]) => (
          <g key={`label-${layerIndex}`}>
            <rect
              x={10}
              y={padding + layerIndex * layerHeight}
              width={leftPadding - 20}
              height={layerHeight - 10}
              fill="#f3f4f6"
              stroke="#d1d5db"
              strokeWidth="1"
              rx="4"
            />
            <text
              x={leftPadding / 2}
              y={padding + layerIndex * layerHeight + layerHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="600"
              fill="#374151"
              className="category-label"
            >
              {label}
            </text>
          </g>
        ))}

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
          const x = timeToX(event.start);
          const eventWidth = timeToX(event.end) - x;
          const y = padding + event.layer * layerHeight;
          const color = COLORS[index % COLORS.length];

          return (
            <g key={`${event.name}-${index}`}>
              <rect
                x={x}
                y={y}
                width={eventWidth}
                height={layerHeight - 10}
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                rx="4"
                className="timeline-event"
              />
              <text
                x={x + eventWidth / 2}
                y={y + layerHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="bold"
                className="timeline-text"
              >
                {event.name}
              </text>
              <text
                x={x + eventWidth / 2}
                y={y + layerHeight / 2 + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="11"
                className="timeline-text"
              >
                {event.startStr || formatTimeValue(event.start, resolution)} - {event.endStr || formatTimeValue(event.end, resolution)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TimelineVertical({ layeredEvents, timeRange, categoryLabels, resolution }) {
  const numLayers = Math.max(...layeredEvents.map(e => e.layer), 0) + 1;
  const hasCategories = categoryLabels.size > 0;
  const topPadding = hasCategories ? 100 : 60;
  const padding = 60;
  const height = 1200;
  const layerWidth = 80;
  const width = numLayers * layerWidth + padding * 2;
  const timelineHeight = height - topPadding - padding;
  const timeSpan = timeRange.max - timeRange.min;

  const timeToY = (time) => {
    return topPadding + ((time - timeRange.min) / timeSpan) * timelineHeight;
  };

  const timeMarkers = [];
  const markerInterval = Math.max(1, Math.ceil(timeSpan / 10));
  for (let time = Math.ceil(timeRange.min / markerInterval) * markerInterval;
       time <= timeRange.max;
       time += markerInterval) {
    timeMarkers.push(time);
  }

  return (
    <div className="timeline-container">
      <svg width={width} height={height} className="timeline-svg">
        {/* Category labels (at top) */}
        {hasCategories && Array.from(categoryLabels.entries()).map(([layerIndex, label]) => (
          <g key={`label-${layerIndex}`}>
            <rect
              x={padding + layerIndex * layerWidth}
              y={10}
              width={layerWidth - 10}
              height={topPadding - 20}
              fill="#f3f4f6"
              stroke="#d1d5db"
              strokeWidth="1"
              rx="4"
            />
            <text
              x={padding + layerIndex * layerWidth + layerWidth / 2}
              y={topPadding / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="600"
              fill="#374151"
              className="category-label"
            >
              {label}
            </text>
          </g>
        ))}

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
          const y = timeToY(event.start);
          const eventHeight = timeToY(event.end) - y;
          const x = padding + event.layer * layerWidth;
          const color = COLORS[index % COLORS.length];

          return (
            <g key={`${event.name}-${index}`}>
              <rect
                x={x}
                y={y}
                width={layerWidth - 10}
                height={eventHeight}
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                rx="4"
                className="timeline-event"
              />
              {/* Name - horizontal text */}
              <text
                x={x + (layerWidth - 10) / 2}
                y={y + 20}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="bold"
                className="timeline-text"
              >
                {event.name}
              </text>
              {/* Time period - horizontal text */}
              <text
                x={x + (layerWidth - 10) / 2}
                y={y + eventHeight - 20}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="10"
                className="timeline-text"
              >
                {event.startStr || formatTimeValue(event.start, resolution)}
              </text>
              <text
                x={x + (layerWidth - 10) / 2}
                y={y + eventHeight - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="10"
                className="timeline-text"
              >
                {event.endStr || formatTimeValue(event.end, resolution)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default Timeline;
