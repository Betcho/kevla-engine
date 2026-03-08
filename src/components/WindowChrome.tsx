// ============================================================
// KEVLA ENGINE — Native Window Chrome
// Simulates desktop .exe window title bar with min/max/close
// ============================================================

import { useState } from 'react';
import { Icon } from './Icons';

interface WindowChromeProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function WindowChrome({ title, subtitle, children }: WindowChromeProps) {
  const [isMaximized] = useState(true);

  return (
    <div className={`wc-window ${isMaximized ? 'maximized' : ''}`}>
      {/* Native title bar */}
      <div className="wc-titlebar">
        <div className="wc-titlebar-left">
          <div className="wc-app-icon">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <defs>
                <linearGradient id="wcg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff8800" />
                  <stop offset="100%" stopColor="#ff4400" />
                </linearGradient>
              </defs>
              <polygon points="8,1 15,8 8,15 1,8" fill="url(#wcg)" />
            </svg>
          </div>
          <span className="wc-title">{title}</span>
          {subtitle && <span className="wc-subtitle">— {subtitle}</span>}
        </div>
        <div className="wc-controls">
          <button className="wc-btn wc-minimize" title="Minimize">
            <Icon name="minus" size={10} />
          </button>
          <button className="wc-btn wc-maximize" title="Maximize">
            <svg viewBox="0 0 10 10" width="10" height="10">
              <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <button className="wc-btn wc-close" title="Close">
            <Icon name="x" size={10} />
          </button>
        </div>
      </div>
      {/* App content */}
      <div className="wc-content">
        {children}
      </div>
    </div>
  );
}
