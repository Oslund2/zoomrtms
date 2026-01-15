# Demo Mode Guide

## Overview

Demo Mode allows you to showcase the RTMS Hub application with realistic synthetic data, perfect for demonstrations, testing, and exploring the UI without requiring live Zoom meetings or a connected database.

## Features

- **Synthetic Data**: Realistic meetings, transcripts, topics, insights, and analytics
- **Live Updates**: Data refreshes every 10 seconds to simulate real-time activity
- **Pause/Resume**: Full control over data updates during presentations
- **Persistent State**: Demo mode preference is saved across browser sessions
- **Multiple Views**: Works across Dashboard, Meeting History, and Ambient Display

## Activation Methods

### Method 1: URL Parameter
Add `?demo=true` to any page URL:
```
http://localhost:5173/?demo=true
http://localhost:5173/display?demo=true
```

### Method 2: UI Controls
1. Look for the floating control panel in the bottom-right corner
2. Click "Enable Demo Mode"
3. The demo mode will activate immediately

### Method 3: Keyboard Shortcut
- Press `D` to toggle demo mode on/off
- Press `P` to pause/resume updates (when in demo mode)

## Using Demo Mode

### Control Panel
The floating control panel provides:
- **Enable/Disable**: Turn demo mode on or off
- **Play/Pause**: Control data updates
- **Reset**: Generate fresh synthetic data
- **Minimize**: Collapse to a small indicator
- **Close**: Hide the control panel temporarily

### Visual Indicators
When demo mode is active, you'll see:
- Blue "DEMO MODE" badge on the Ambient Display
- Banner at the top of Dashboard and Meeting History pages
- Blue indicator in the control panel
- Pulsing dot showing active status

## Demo Data

### Dashboard View
- 2 active meetings with participants
- Recent transcript snippets
- Meeting statistics
- Real-time participant counts

### Meeting History
- 20 meetings spanning 2 weeks
- Varied meeting topics and participants
- Realistic timestamps and durations
- Active and ended meeting statuses

### Ambient Display (Most Impressive!)
- **Knowledge Graph**: 25-35 connected topic nodes that grow over time
- **Topic Heatmap**: Color-coded discussion intensity across 9 rooms
- **Live Insights**: Streaming feed of alignments, misalignments, and gaps
- **Room Activity**: Real-time status of main and breakout rooms
- **Auto-Updates**: New content appears every 10 seconds

## Update Cycle

Every 10 seconds (when not paused), the demo mode:
1. Adds 1-2 new topics to the knowledge graph
2. Creates new relationships between topics
3. Generates 2-3 fresh insights
4. Updates room activity statuses
5. Adjusts heatmap intensities

## Best Practices for Presentations

1. **Pre-activate**: Enable demo mode before your presentation starts
2. **Fullscreen Display**: Press `F` on the Ambient Display for fullscreen mode
3. **Pause When Needed**: Hit `P` to pause updates while explaining specific insights
4. **Reset for Fresh Demo**: Use the reset button between different audiences
5. **Minimize Controls**: Collapse the control panel to maximize screen space

## Data Themes

The synthetic data covers realistic business scenarios:
- **Strategy**: Digital transformation, market positioning, competitive analysis
- **Operations**: Process automation, workflow optimization, quality assurance
- **Technology**: Cloud migration, microservices, API architecture, DevOps
- **People**: Change management, training, team culture, leadership
- **Finance**: Budget planning, ROI analysis, cost optimization

## Technical Details

### Data Generation
- Uses realistic business terminology and scenarios
- 30+ unique speaker names with diverse backgrounds
- 20+ meeting topics across various business functions
- Temporal and logical consistency across all data

### Performance
- Simulated loading delays (300-500ms) for realism
- Efficient data updates without full page reloads
- Smooth animations and transitions
- No database queries in demo mode

### Storage
- Demo mode preference: localStorage
- Pause state: localStorage
- Survives page refreshes and navigation

## Troubleshooting

**Q: Demo mode isn't showing data?**
A: Refresh the page or use the Reset button in the control panel.

**Q: Updates seem slow?**
A: Updates occur every 10 seconds. Use the pause/resume feature if needed.

**Q: Can I speed up updates?**
A: The 10-second interval is hardcoded for optimal presentation pacing.

**Q: Lost the control panel?**
A: Refresh the page - the control panel reappears on load.

## Exiting Demo Mode

1. Click "Disable Demo Mode" in the control panel
2. Press `D` on your keyboard
3. Clear localStorage and refresh

Demo mode state is automatically cleared when disabled, returning you to live data mode.
