// ============================================================
// KEVLA ENGINE — Timeline Panel
// Time-Travel Debugging UI — scrubber, branches, ghosts
// ============================================================

import { useRef, useCallback, useState, useEffect } from 'react';
import { useEngineStore } from '../engine/store';
import { Icon } from './Icons';

// ---- Minimap keyframe indicator ----
function Keyframe({ x, color, label, onClick }: { x: number; color: string; label?: string; onClick?: () => void }) {
  return (
    <div className="tl-keyframe" style={{ left: `${x}%` }} onClick={onClick} title={label}>
      <div className="tl-keyframe-diamond" style={{ borderColor: color }} />
    </div>
  );
}

export default function Timeline() {
  const isPlaying = useEngineStore(s => s.isPlaying);
  const isPaused = useEngineStore(s => s.isPaused);
  const temporal = useEngineStore(s => s.temporalEngine);
  const temporalConfig = useEngineStore(s => s.temporalConfig);
  const temporalScrub = useEngineStore(s => s.temporalScrub);
  const temporalStepForward = useEngineStore(s => s.temporalStepForward);
  const temporalStepBackward = useEngineStore(s => s.temporalStepBackward);
  const temporalJumpToStart = useEngineStore(s => s.temporalJumpToStart);
  const temporalJumpToEnd = useEngineStore(s => s.temporalJumpToEnd);
  const temporalForkBranch = useEngineStore(s => s.temporalForkBranch);
  const temporalSwitchBranch = useEngineStore(s => s.temporalSwitchBranch);
  const temporalDeleteBranch = useEngineStore(s => s.temporalDeleteBranch);
  const temporalAddBookmark = useEngineStore(s => s.temporalAddBookmark);
  const temporalToggleGhosts = useEngineStore(s => s.temporalToggleGhosts);
  const temporalToggleTrails = useEngineStore(s => s.temporalToggleTrails);
  const temporalSetGhostCount = useEngineStore(s => s.temporalSetGhostCount);
  const pause = useEngineStore(s => s.pause);
  const play = useEngineStore(s => s.play);

  const scrubberRef = useRef<HTMLDivElement>(null);
  const [showBranches, setShowBranches] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const data = temporal.getTimelineData();
  const hasFrames = data.totalFrames > 0;
  const progress = hasFrames ? (data.currentFrame / Math.max(1, data.totalFrames - 1)) * 100 : 0;
  const currentSnap = temporal.getCurrentSnapshot();

  // Format time from frame
  const formatTime = (frame: number): string => {
    const snap = temporal.getSnapshot(frame);
    if (!snap) return '0.00s';
    return `${snap.timestamp.toFixed(2)}s`;
  };

  // Scrub handler (mouse drag)
  const handleScrub = useCallback((clientX: number) => {
    if (!scrubberRef.current || !hasFrames) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const frame = Math.round(pct * (data.totalFrames - 1));
    temporalScrub(frame);
  }, [hasFrames, data.totalFrames, temporalScrub]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!hasFrames) return;
    // Pause if playing
    if (isPlaying && !isPaused) pause();
    setIsDragging(true);
    handleScrub(e.clientX);

    const onMove = (ev: MouseEvent) => handleScrub(ev.clientX);
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [hasFrames, isPlaying, isPaused, pause, handleScrub]);

  // Keyboard shortcuts for timeline
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isPlaying && !hasFrames) return;
      if (e.key === ',' || e.key === '<') { e.preventDefault(); temporalStepBackward(); }
      if (e.key === '.' || e.key === '>') { e.preventDefault(); temporalStepForward(); }
      if (e.key === 'Home') { e.preventDefault(); temporalJumpToStart(); }
      if (e.key === 'End') { e.preventDefault(); temporalJumpToEnd(); }
      if (e.key === 'b' && e.ctrlKey) { e.preventDefault(); temporalForkBranch(); }
      if (e.key === 'm' && e.ctrlKey) { e.preventDefault(); temporalAddBookmark('Bookmark'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, hasFrames, temporalStepForward, temporalStepBackward, temporalJumpToStart, temporalJumpToEnd, temporalForkBranch, temporalAddBookmark]);

  const memLabel = data.memoryKB < 1024
    ? `${data.memoryKB} KB`
    : `${(data.memoryKB / 1024).toFixed(1)} MB`;

  if (!isPlaying && !hasFrames) {
    return (
      <div className="tl-bar tl-inactive">
        <div className="tl-label">
          <Icon name="clock" size={12} />
          <span>Temporal Engine</span>
        </div>
        <div className="tl-hint">Press Play to start recording timeline</div>
      </div>
    );
  }

  return (
    <div className={`tl-bar ${data.isRecording ? 'recording' : ''} ${isDragging ? 'dragging' : ''}`}>
      {/* Left controls */}
      <div className="tl-controls">
        <button className="tl-btn" onClick={temporalJumpToStart} title="Jump to Start (Home)" disabled={!hasFrames}>
          <Icon name="skipBack" size={11} />
        </button>
        <button className="tl-btn" onClick={temporalStepBackward} title="Step Back (<)" disabled={!hasFrames || data.currentFrame === 0}>
          <Icon name="stepBack" size={11} />
        </button>

        {data.isRecording ? (
          <div className="tl-rec-indicator" title="Recording">
            <span className="tl-rec-dot" />
            <span>REC</span>
          </div>
        ) : (
          <button className="tl-btn tl-btn-resume" onClick={() => play()} title="Resume Recording">
            <Icon name="play" size={9} />
          </button>
        )}

        <button className="tl-btn" onClick={temporalStepForward} title="Step Forward (>)" disabled={!hasFrames || data.currentFrame >= data.totalFrames - 1}>
          <Icon name="stepForward" size={11} />
        </button>
        <button className="tl-btn" onClick={temporalJumpToEnd} title="Jump to End (End)" disabled={!hasFrames}>
          <Icon name="skipForward" size={11} />
        </button>
      </div>

      {/* Frame counter */}
      <div className="tl-frame-info">
        <span className="tl-frame-num">{data.currentFrame}</span>
        <span className="tl-frame-sep">/</span>
        <span className="tl-frame-total">{data.totalFrames}</span>
        <span className="tl-frame-time">{hasFrames ? formatTime(data.currentFrame) : '0.00s'}</span>
      </div>

      {/* Scrubber bar */}
      <div className="tl-scrubber-container">
        <div className="tl-scrubber" ref={scrubberRef} onMouseDown={handleMouseDown}>
          {/* Background track */}
          <div className="tl-track">
            {/* Branch indicator (colored bar) */}
            <div className="tl-track-fill" style={{
              width: `${progress}%`,
              backgroundColor: data.branches.find(b => b.isActive)?.color || '#61afef',
            }} />

            {/* Bookmarks */}
            {data.bookmarks.map((bm, i) => {
              const pct = hasFrames ? (bm.frame / (data.totalFrames - 1)) * 100 : 0;
              return <Keyframe key={i} x={pct} color="#e5c07b" label={bm.label} onClick={() => temporalScrub(bm.frame)} />;
            })}

            {/* Fork points from other branches */}
            {data.branches.filter(b => !b.isActive && b.forkFrame > 0).map(b => {
              const pct = hasFrames ? (b.forkFrame / (data.totalFrames - 1)) * 100 : 0;
              return <Keyframe key={b.id} x={pct} color={b.color} label={`Fork: ${b.name}`} onClick={() => temporalSwitchBranch(b.id)} />;
            })}
          </div>

          {/* Playhead */}
          <div className="tl-playhead" style={{ left: `${progress}%` }}>
            <div className="tl-playhead-handle" />
            <div className="tl-playhead-line" />
          </div>
        </div>

        {/* Entity count under scrubber */}
        {currentSnap && (
          <div className="tl-snap-info">
            <span>{currentSnap.entityCount} entities</span>
            <span>{currentSnap.activeContacts} contacts</span>
            {currentSnap.scriptErrors > 0 && <span className="tl-snap-err">{currentSnap.scriptErrors} errors</span>}
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="tl-right-controls">
        {/* Ghost toggle */}
        <button className={`tl-btn ${temporalConfig.ghostCount > 0 ? 'active' : ''}`}
          onClick={temporalToggleGhosts}
          title="Toggle Ghost Rendering">
          <Icon name="ghost" size={12} />
        </button>

        {/* Trail toggle */}
        <button className={`tl-btn ${temporalConfig.showTrails ? 'active' : ''}`}
          onClick={temporalToggleTrails}
          title="Toggle Movement Trails">
          <Icon name="trail" size={12} />
        </button>

        {/* Fork branch */}
        <button className="tl-btn tl-btn-fork" onClick={() => temporalForkBranch()} title="Fork Branch (Ctrl+B)" disabled={!hasFrames}>
          <Icon name="fork" size={12} />
        </button>

        {/* Bookmark */}
        <button className="tl-btn" onClick={() => temporalAddBookmark(`F${data.currentFrame}`)} title="Add Bookmark (Ctrl+M)" disabled={!hasFrames}>
          <Icon name="bookmark" size={12} />
        </button>

        {/* Branch selector */}
        {data.branches.length > 1 && (
          <div className="tl-branch-wrapper">
            <button className={`tl-btn tl-btn-branch ${showBranches ? 'active' : ''}`}
              onClick={() => { setShowBranches(!showBranches); setShowSettings(false); }}>
              <span className="tl-branch-dot" style={{ backgroundColor: data.branches.find(b => b.isActive)?.color }} />
              <span className="tl-branch-count">{data.branches.length}</span>
            </button>
            {showBranches && (
              <div className="tl-branch-dropdown">
                <div className="tl-branch-title">Timeline Branches</div>
                {data.branches.map(b => (
                  <div key={b.id} className={`tl-branch-item ${b.isActive ? 'active' : ''}`}
                    onClick={() => { temporalSwitchBranch(b.id); setShowBranches(false); }}>
                    <span className="tl-branch-color" style={{ backgroundColor: b.color }} />
                    <span className="tl-branch-name">{b.name}</span>
                    <span className="tl-branch-frames">{b.frameCount}f</span>
                    {b.id !== 'main' && (
                      <button className="tl-branch-del" onClick={(e) => { e.stopPropagation(); temporalDeleteBranch(b.id); }}>
                        <Icon name="x" size={9} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="tl-settings-wrapper">
          <button className={`tl-btn ${showSettings ? 'active' : ''}`}
            onClick={() => { setShowSettings(!showSettings); setShowBranches(false); }}>
            <Icon name="settings" size={11} />
          </button>
          {showSettings && (
            <div className="tl-settings-dropdown">
              <div className="tl-settings-title">Temporal Settings</div>
              <div className="tl-setting">
                <span>Ghost Count</span>
                <input type="range" min={0} max={10} value={temporalConfig.ghostCount}
                  onChange={e => temporalSetGhostCount(parseInt(e.target.value))} />
                <span className="tl-setting-val">{temporalConfig.ghostCount}</span>
              </div>
              <div className="tl-setting">
                <span>Ghost Spacing</span>
                <input type="range" min={1} max={30} value={temporalConfig.ghostSpacing}
                  onChange={e => useEngineStore.getState().temporalUpdateConfig({ ghostSpacing: parseInt(e.target.value) })} />
                <span className="tl-setting-val">{temporalConfig.ghostSpacing}f</span>
              </div>
              <div className="tl-setting">
                <span>Max Frames</span>
                <span className="tl-setting-val">{temporalConfig.maxFrames}</span>
              </div>
            </div>
          )}
        </div>

        {/* Memory indicator */}
        <div className="tl-memory" title={`Memory: ${memLabel}`}>
          <Icon name="info" size={9} />
          <span>{memLabel}</span>
        </div>
      </div>
    </div>
  );
}
