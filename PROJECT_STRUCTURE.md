# DoItLater - Project Structure

## 📁 Directory Overview

```
DoItLater-Front-end/
├── Index.html                          # Main landing page (entry point)
├── README.md                            # Project documentation
├── PROJECT_STRUCTURE.md                 # This file
│
├── 📂 assets/                           # Static assets
│   ├── css/                             # Stylesheets
│   │   ├── themes.css                   # Theme system and variables
│   │   └── styles.css                   # Global and landing page styles
│   └── js/                              # JavaScript files
│       └── themes.js                    # Theme management script
│
├── 📂 pages/                            # Feature pages
│   ├── task-tracker.html                # Task Tracker page
│   └── habit-tracker.html               # Habit Tracker page
│
├── 📂 configurations/                   # App configuration files
│   ├── app.js                           # Main application logic
│   └── types.js                         # Type definitions
│
└── 📂 Features/                         # Feature modules
    ├── TaskTracker-GUI/                 # Task Tracker feature
    │   ├── main.html                    # Task Tracker HTML
    │   ├── app.js                       # Task Tracker logic
    │   └── style.css                    # Task Tracker styles
    │
    └── HabitTracjer-GUI/                # Habit Tracker feature
        ├── tcr.html                     # Habit Tracker HTML
        ├── tcr.css                      # Habit Tracker styles
        └── Panel/                       # Habit detail panel
            ├── habit-detail.html        # Detail panel HTML
            ├── habit-detail.js          # Detail panel logic
            └── habit-detail.css         # Detail panel styles
```

## 🎯 Key Features

### Main Landing Page (Index.html)
- **Hero Section**: Welcoming introduction with call-to-action buttons
- **Features Section**: Display of both Task Tracker and Habit Tracker features
- **About Section**: Overview of the application
- **Navigation**: Easy navigation between pages

### Task Tracker (`pages/task-tracker.html`)
- Manage your daily tasks
- Create, edit, and complete tasks
- Task prioritization and organization

### Habit Tracker (`pages/habit-tracker.html`)
- Build and track habits
- Monitor progress over time
- Habit statistics and insights

## 🎨 Theming System

The application includes a comprehensive theming system:

### Theme Modes
- **Light Theme** (default)
- **Dark Theme**

### Color Themes
- Default (Indigo)
- Purple
- Blue
- Green
- Orange

Themes are stored in browser localStorage for persistence.

## 🚀 Getting Started

1. Open `Index.html` in your browser
2. Navigate to Task Tracker or Habit Tracker from the main page
3. Switch themes using the theme controls
4. Start managing your tasks and habits!

## 📝 Configuration Files

### app.js
Contains main application logic and functionality shared across features.

### types.js
Defines data types and structures used throughout the application.

## 🎨 Styling

- **themes.css**: Color variables, theme definitions, and common component styles
- **styles.css**: Landing page and global layout styles
- Feature-specific styles are located in their respective directories

## 📱 Responsive Design

All pages are fully responsive and optimized for:
- Desktop browsers
- Tablets
- Mobile devices

## 🔗 File Organization Best Practices

- **assets/**: All static files (CSS, JS, images)
- **pages/**: HTML pages for different features
- **configurations/**: Shared configuration and utility files
- **Features/**: Feature-specific modules with their own HTML, CSS, and JS
