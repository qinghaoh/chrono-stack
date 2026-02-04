/**
 * Parse timeline data from text format
 * Format depends on resolution and layering mode:
 *
 * Auto-layering (overlaps determine layers):
 * - Year: "Name:2020 - 2021"
 * - Month: "Name:2020-01 - 2021-12"
 * - Day: "Name:2020-01-15 - 2021-03-20"
 *
 * Fixed-layering (categories determine layers):
 * - Year: "Category|Name:2020 - 2021"
 * - Month: "Category|Name:2020-01 - 2021-12"
 * - Day: "Category|Name:2020-01-15 - 2021-03-20"
 */

/**
 * Convert time value to numeric representation based on resolution
 */
function parseTimeValue(value, resolution) {
  value = value.trim();

  switch (resolution) {
    case 'year':
      // Year: just the integer value
      return parseInt(value, 10);

    case 'month': {
      // Month: "YYYY-MM" -> convert to months since year 0
      const monthMatch = value.match(/^(\d+)-(\d{1,2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1], 10);
        const month = parseInt(monthMatch[2], 10);
        return year * 12 + month;
      }
      // Fallback: try as year
      return parseInt(value, 10) * 12;
    }

    case 'day': {
      // Day: "YYYY-MM-DD" -> convert to days since epoch
      const dayMatch = value.match(/^(\d+)-(\d{1,2})-(\d{1,2})$/);
      if (dayMatch) {
        const year = parseInt(dayMatch[1], 10);
        const month = parseInt(dayMatch[2], 10) - 1; // JS months are 0-indexed
        const day = parseInt(dayMatch[3], 10);
        const date = new Date(year, month, day);
        return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
      }
      // Fallback: try as year
      return parseInt(value, 10) * 365;
    }

    default:
      return parseInt(value, 10);
  }
}

/**
 * Format numeric time value back to string based on resolution
 */
export function formatTimeValue(value, resolution) {
  switch (resolution) {
    case 'year':
      return Math.round(value).toString();

    case 'month': {
      const year = Math.floor(value / 12);
      const month = Math.round(value % 12);
      return `${year}-${month.toString().padStart(2, '0')}`;
    }

    case 'day': {
      const date = new Date(value * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    default:
      return Math.round(value).toString();
  }
}

export function parseTimelineData(input, resolution = 'year') {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const events = [];

  // Check if input uses the new compact format (lines with Category|entries)
  // New format: each line is "Category|Name1:Start-End,Name2:Start-End,..."
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);

  // Detect format: if a line starts with "Category|" followed by entries without "|" in them
  const isCompactFormat = lines.some(line => {
    if (!line.includes('|')) return false;
    const pipeIndex = line.indexOf('|');
    const afterPipe = line.substring(pipeIndex + 1);
    // In compact format, entries after | don't contain |
    // In old format, each comma-separated entry might have its own |
    const entries = afterPipe.split(',');
    return entries.length > 1 && entries.slice(1).every(e => !e.includes('|'));
  });

  if (isCompactFormat) {
    // New compact format: Category|Entry1,Entry2,Entry3 (one category per line)
    for (const line of lines) {
      let category = null;
      let entriesStr = line;

      if (line.includes('|')) {
        const pipeIndex = line.indexOf('|');
        category = line.substring(0, pipeIndex).trim();
        entriesStr = line.substring(pipeIndex + 1).trim();
      }

      const entries = entriesStr.split(',').map(e => e.trim()).filter(e => e);

      for (const entry of entries) {
        // Match pattern: "Name:Start - End" or "Name:Start - End{note}"
        const match = entry.match(/^(.+?):(.+?)\s*-\s*([^{]+?)(?:\{(.+?)\})?$/);
        if (match) {
          const [, name, startStr, endStr, note] = match;
          const start = parseTimeValue(startStr, resolution);
          const end = parseTimeValue(endStr, resolution);

          if (!isNaN(start) && !isNaN(end)) {
            events.push({
              name: name.trim(),
              category,
              start,
              end,
              startStr: startStr.trim(),
              endStr: endStr.trim(),
              note: note ? note.trim() : null,
            });
          }
        }
      }
    }
  } else {
    // Old format: Category|Name:Start - End,Category|Name:Start - End,...
    const allEntries = input.split(',').map(e => e.trim()).filter(e => e);

    for (const entry of allEntries) {
      let category = null;
      let entryWithoutCategory = entry;

      if (entry.includes('|')) {
        const pipeIndex = entry.indexOf('|');
        category = entry.substring(0, pipeIndex).trim();
        entryWithoutCategory = entry.substring(pipeIndex + 1).trim();
      }

      // Match pattern: "Name:Start - End" or "Name:Start - End{note}"
      const match = entryWithoutCategory.match(/^(.+?):(.+?)\s*-\s*([^{]+?)(?:\{(.+?)\})?$/);
      if (match) {
        const [, name, startStr, endStr, note] = match;
        const start = parseTimeValue(startStr, resolution);
        const end = parseTimeValue(endStr, resolution);

        if (!isNaN(start) && !isNaN(end)) {
          events.push({
            name: name.trim(),
            category,
            start,
            end,
            startStr: startStr.trim(),
            endStr: endStr.trim(),
            note: note ? note.trim() : null,
          });
        }
      }
    }
  }

  // Assign note indices to events that have notes
  let noteIndex = 1;
  for (const event of events) {
    if (event.note) {
      event.noteIndex = noteIndex++;
    }
  }

  return events;
}

/**
 * Calculate layers for events
 * - If events have categories, use fixed layering by category
 * - Otherwise, use auto-layering based on time overlaps
 */
export function calculateLayers(events) {
  if (events.length === 0) return [];

  // Check if events have categories
  const hasCategories = events.some(e => e.category !== null);

  if (hasCategories) {
    return calculateFixedLayers(events);
  } else {
    return calculateAutoLayers(events);
  }
}

/**
 * Auto-layering: Events that overlap in time go on different layers
 */
function calculateAutoLayers(events) {
  // Sort events by start time, then by end time
  const sortedEvents = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });

  const layers = [];

  for (const event of sortedEvents) {
    // Find the first layer where this event can fit
    let placed = false;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const lastEvent = layer[layer.length - 1];

      // Check if there's no overlap with the last event in this layer
      if (lastEvent.end <= event.start) {
        layer.push({ ...event, layer: i });
        placed = true;
        break;
      }
    }

    // If no suitable layer found, create a new one
    if (!placed) {
      layers.push([{ ...event, layer: layers.length }]);
    }
  }

  // Flatten the layers array
  return layers.flat();
}

/**
 * Fixed-layering: Each category gets its own dedicated layer
 */
function calculateFixedLayers(events) {
  // Group events by category (raw category string with transitions)
  const categoryMap = new Map();
  const categoryOrder = [];
  const categoryParsed = new Map(); // Store parsed category info

  for (const event of events) {
    const cat = event.category || 'Uncategorized';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
      categoryOrder.push(cat);
      // Parse category name and transitions
      categoryParsed.set(cat, parseCategoryWithTransitions(cat));
    }
    categoryMap.get(cat).push(event);
  }

  // Assign layer index to each category and sort events within each layer
  const result = [];
  categoryOrder.forEach((category, layerIndex) => {
    const categoryEvents = categoryMap.get(category);
    const parsed = categoryParsed.get(category);

    // Sort events by start time within the category
    categoryEvents.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });

    categoryEvents.forEach(event => {
      result.push({
        ...event,
        layer: layerIndex,
        layerLabel: parsed.baseName,
        layerTransitions: parsed.transitions,
      });
    });
  });

  return result;
}

/**
 * Get footnotes from events (events that have notes)
 */
export function getFootnotes(events) {
  return events
    .filter(e => e.note && e.noteIndex)
    .map(e => ({
      index: e.noteIndex,
      name: e.name,
      note: e.note,
    }))
    .sort((a, b) => a.index - b.index);
}

/**
 * Parse category name with optional transitions
 * Format: "OriginalName{year:NewName}{year2:AnotherName}"
 * Returns: { baseName: string, transitions: [{year: number, name: string}] }
 */
function parseCategoryWithTransitions(categoryStr) {
  if (!categoryStr) return { baseName: null, transitions: [] };

  const transitions = [];
  let baseName = categoryStr;

  // Extract all {year:name} patterns
  const transitionPattern = /\{(\d+):([^}]+)\}/g;
  let match;

  while ((match = transitionPattern.exec(categoryStr)) !== null) {
    transitions.push({
      year: parseInt(match[1], 10),
      name: match[2].trim(),
    });
  }

  // Remove transition patterns from base name
  baseName = categoryStr.replace(transitionPattern, '').trim();

  // Sort transitions by year
  transitions.sort((a, b) => a.year - b.year);

  return { baseName, transitions };
}

/**
 * Get category labels for fixed-layering mode
 * Returns a Map of layer -> { label: string, transitions: [{year: number, name: string}] }
 */
export function getCategoryLabels(events) {
  const labels = new Map();
  for (const event of events) {
    if (event.layerLabel && !labels.has(event.layer)) {
      labels.set(event.layer, {
        label: event.layerLabel,
        transitions: event.layerTransitions || [],
      });
    }
  }
  return labels;
}

/**
 * Adjust overlapping events within the same layer
 * For each time unit, if N events include it, divide that unit into N parts
 *
 * Example: 李傀(760-760), 桑如珪(760-760), 郭子儀(760-761), 臧希讓(761-762)
 * - Year 760: shared by 3 events → each gets 1/3
 * - Year 761: shared by 2 events (郭子儀, 臧希讓) → each gets 1/2
 * - 郭子儀's visual duration = 1/3 (for 760) + 1/2 (for 761) = 5/6
 */
function adjustOverlappingEvents(events) {
  if (events.length === 0) return events;

  // Group events by layer
  const layerGroups = {};
  events.forEach(event => {
    const layer = event.layer;
    if (!layerGroups[layer]) {
      layerGroups[layer] = [];
    }
    layerGroups[layer].push(event);
  });

  const adjustedEvents = [];

  // Process each layer
  Object.values(layerGroups).forEach(layerEvents => {
    // Assign unique index to each event for later lookup
    const eventIndices = new Map();
    layerEvents.forEach((event, idx) => {
      eventIndices.set(event, idx);
    });

    // Find all time units and which events include them
    const timeUnits = new Map(); // timeUnit -> list of events that include it

    for (const event of layerEvents) {
      // For each time unit from floor(start) to floor(end) (inclusive)
      const startUnit = Math.floor(event.start);
      const endUnit = Math.floor(event.end);
      for (let t = startUnit; t <= endUnit; t++) {
        if (!timeUnits.has(t)) {
          timeUnits.set(t, []);
        }
        timeUnits.get(t).push(event);
      }
    }

    // Sort events within each time unit by start time, then by duration (shorter first)
    for (const [t, eventsInUnit] of timeUnits.entries()) {
      eventsInUnit.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return (a.end - a.start) - (b.end - b.start);
      });
    }

    // Calculate visual positions for each event
    const layerAdjusted = layerEvents.map(event => {
      const startUnit = Math.floor(event.start);
      const endUnit = Math.floor(event.end);

      // Find position in start unit
      const eventsInStartUnit = timeUnits.get(startUnit);
      const startPosition = eventsInStartUnit.findIndex(e => eventIndices.get(e) === eventIndices.get(event));
      const startCount = eventsInStartUnit.length;
      const visualStart = startUnit + startPosition / startCount;

      // Find position in end unit
      const eventsInEndUnit = timeUnits.get(endUnit);
      const endPosition = eventsInEndUnit.findIndex(e => eventIndices.get(e) === eventIndices.get(event));
      const endCount = eventsInEndUnit.length;
      const visualEnd = endUnit + (endPosition + 1) / endCount;

      return {
        ...event,
        visualStart,
        visualEnd,
      };
    });

    adjustedEvents.push(...layerAdjusted);
  });

  return adjustedEvents;
}

/**
 * Get the time range for all events (using visual positions if available)
 */
export function getTimeRange(events) {
  if (events.length === 0) {
    return { min: 0, max: 100 };
  }

  const starts = events.map(e => e.visualStart !== undefined ? e.visualStart : e.start);
  const ends = events.map(e => e.visualEnd !== undefined ? e.visualEnd : e.end);

  return {
    min: Math.min(...starts),
    max: Math.max(...ends),
  };
}

/**
 * Process events: calculate layers and adjust overlapping events
 */
export function processEvents(events) {
  const layeredEvents = calculateLayers(events);
  return adjustOverlappingEvents(layeredEvents);
}
