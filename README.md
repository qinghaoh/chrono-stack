# ChronoStack Timeline Visualizer

A simple, interactive web application for visualizing historical events on a timeline. Built with React + Vite and SVG.

## Features

- **Dual Layering Modes**:
  - **Auto-Layering**: Events automatically distributed across layers based on time overlaps
  - **Fixed-Layering**: Category-based layers with labels (e.g., states, teams, departments)
- **Multiple Time Resolutions**: Support for year, month, and day granularities
- **Simple Input Format**: Text-based input with intuitive syntax
- **Interactive SVG**: Scalable, responsive timeline visualization
- **Rich Example Datasets**: Pre-loaded examples for both layering modes and all resolutions
- **Keyboard Shortcuts**: Press `Ctrl + Enter` to quickly visualize your timeline

## Demo

The application displays historical events as colored blocks on a timeline, with:
- A horizontal time axis at the bottom
- Events displayed as rectangular blocks above the axis
- Multiple layers when events overlap in time
- Each event showing its name and time period

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

ChronoStack supports two layering modes:

### 1. Auto-Layering (Default)

Events are automatically distributed across layers based on time overlaps.

**Format:**
```
Name:Start - End, Name:Start - End, ...
```

**Example:**
```
新:9 - 25,东汉:25 - 220,魏:220 - 266,蜀:221 - 263,吴:222 - 280
```

This creates a timeline showing Chinese dynasties with automatic layering for overlapping periods (like 魏, 蜀, and 吴).

### 2. Fixed-Layering (Category-Based)

Each category gets its own dedicated layer with a label. Perfect for visualizing parallel sequences like rulers of different states, projects by different teams, etc.

**Format:**
```
Category|Name:Start - End, Category|Name:Start - End, ...
```

**Example (Warring States Rulers):**
```
秦|孝公:-361 - -338,秦|惠文王:-337 - -311,秦|武王:-310 - -307,
楚|威王:-339 - -329,楚|怀王:-328 - -299,楚|顷襄王:-298 - -263,
齐|威王:-356 - -320,齐|宣王:-319 - -301,齐|湣王:-300 - -284
```

This creates 3 fixed layers (秦, 楚, 齐), each showing the sequential rulers of that state.

### Resolution Support

ChronoStack supports three time resolutions:

- **Year**: `Name:2020 - 2021`
- **Month**: `Name:2020-01 - 2021-12`
- **Day**: `Name:2020-01-15 - 2021-03-20`

### More Examples

**Auto-Layering - European Historical Periods:**
```
Renaissance:1300 - 1600,Age of Discovery:1400 - 1600,Reformation:1517 - 1648,Enlightenment:1685 - 1815,Industrial Revolution:1760 - 1840
```

**Fixed-Layering - World Leaders:**
```
USA|Washington:1789 - 1797,USA|Adams:1797 - 1801,USA|Jefferson:1801 - 1809,
France|Louis XVI:1774 - 1792,France|Napoleon:1804 - 1814,
UK|George III:1760 - 1820,UK|George IV:1820 - 1830
```

**Fixed-Layering - Project Teams (Month Resolution):**
```
Frontend|React Development:2020-01 - 2020-12,Frontend|Vue Migration:2021-01 - 2021-12,
Backend|API v1:2020-01 - 2020-12,Backend|API v2:2021-01 - 2022-12,
DevOps|CI/CD Setup:2020-01 - 2020-06,DevOps|Cloud Migration:2021-01 - 2021-12
```

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **SVG** - Scalable vector graphics for visualization
- **CSS3** - Styling and responsive design

## Project Structure

```
chrono-timeline/
├── src/
│   ├── components/
│   │   ├── Timeline.jsx       # SVG timeline visualization component
│   │   └── Timeline.css       # Timeline styles
│   ├── utils/
│   │   └── timelineParser.js  # Parse and process timeline data
│   ├── App.jsx                # Main application component
│   ├── App.css                # Application styles
│   ├── index.css              # Global styles
│   └── main.jsx               # Application entry point
├── package.json
└── README.md
```

## Customization

### Colors

Edit the `COLORS` array in `src/components/Timeline.jsx` to customize event colors:

```javascript
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  // Add more colors...
];
```

### Timeline Appearance

Modify constants in `src/components/Timeline.jsx`:

- `layerHeight`: Height of each layer (default: 60)
- `padding`: Padding around the SVG (default: 60)
- `width`: Total SVG width (default: 1200)

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- SVG

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Future Enhancements

- Export timeline as PNG/SVG image
- Dark mode support
- Zoom and pan functionality
- Tooltips with detailed event information
- Custom color picker for events
- Import/export timeline data as JSON
- Multiple timeline views (horizontal/vertical)
