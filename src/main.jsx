import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// CSS import order mirrors the <link> order in the old HTML.
// Do not reorder — the theme overrides in themes.css / abyss-theme.css
// rely on coming before the feature stylesheets.
import './styles/themes.css';
import './styles/abyss-theme.css';
import './styles/task-tracker.css';
import './styles/habit-dash.css';
import './styles/habit-detail.css';
import './styles/main.css';

function Placeholder() {
  return (
    <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <h1>Vite + React is alive</h1>
      <p>
        Current theme attribute:{' '}
        <code>{document.documentElement.getAttribute('data-theme')}</code>
      </p>
      <p>Next step: theme provider, routes, pages.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Placeholder />
    </BrowserRouter>
  </React.StrictMode>
);
