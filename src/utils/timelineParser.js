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
  const entries = input.split(',').map(e => e.trim()).filter(e => e);

  for (const entry of entries) {
    // Check for category format: "Category|Name:Start - End"
    let category = null;
    let entryWithoutCategory = entry;

    if (entry.includes('|')) {
      const pipeIndex = entry.indexOf('|');
      category = entry.substring(0, pipeIndex).trim();
      entryWithoutCategory = entry.substring(pipeIndex + 1).trim();
    }

    // Match pattern: "Name:Start - End"
    const match = entryWithoutCategory.match(/^(.+?):(.+?)\s*-\s*(.+?)$/);
    if (match) {
      const [, name, startStr, endStr] = match;
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
        });
      }
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
  // Group events by category
  const categoryMap = new Map();
  const categoryOrder = [];

  for (const event of events) {
    const cat = event.category || 'Uncategorized';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
      categoryOrder.push(cat);
    }
    categoryMap.get(cat).push(event);
  }

  // Assign layer index to each category and sort events within each layer
  const result = [];
  categoryOrder.forEach((category, layerIndex) => {
    const categoryEvents = categoryMap.get(category);
    // Sort events by start time within the category
    categoryEvents.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });

    categoryEvents.forEach(event => {
      result.push({
        ...event,
        layer: layerIndex,
        layerLabel: category,
      });
    });
  });

  return result;
}

/**
 * Get category labels for fixed-layering mode
 */
export function getCategoryLabels(events) {
  const labels = new Map();
  for (const event of events) {
    if (event.layerLabel && !labels.has(event.layer)) {
      labels.set(event.layer, event.layerLabel);
    }
  }
  return labels;
}

/**
 * Get the time range for all events
 */
export function getTimeRange(events) {
  if (events.length === 0) {
    return { min: 0, max: 100 };
  }

  const starts = events.map(e => e.start);
  const ends = events.map(e => e.end);

  return {
    min: Math.min(...starts),
    max: Math.max(...ends),
  };
}
