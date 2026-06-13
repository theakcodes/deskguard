import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./App.css";

const INITIAL_SEATS = (() => {
  const seats = [];
  const rows = ["A", "B", "C", "D", "E", "F"];
  const statuses = [
    "free", "free", "free", "free", "occupied", "occupied",
    "away", "free", "free", "free", "free", "occupied",
    "free", "free", "away", "free", "occupied", "free",
    "free", "free", "free", "free", "occupied", "free"
  ];
  let idx = 0;
  rows.forEach((row) => {
    for (let col = 1; col <= 6; col++) {
      const st = statuses[idx % statuses.length];
      let zone = "";
      let features = [];
      
      if (row === "A" || row === "B") {
        zone = "Reading Hall";
        features = ["Study Table"];
        if (col <= 3) features.push("Window View");
        if (col % 2 === 0) features.push("Charging");
      } else if (row === "C") {
        zone = "Books Stock Area";
        features = ["Quiet Alcove", "Charging"];
      } else if (row === "D") {
        zone = "Digital Library";
        features = ["PC Terminal", "High-Speed Lan"];
        if (col % 2 === 0) features.push("Charging");
      } else if (row === "E") {
        if (col <= 3) {
          zone = "Periodical Section";
          features = ["Reading Chair", "Magazines"];
        } else {
          zone = "Discussion Rooms";
          features = ["Group Table", "Whiteboard", "Charging"];
        }
      } else if (row === "F") {
        zone = "Digital Library";
        features = ["PC Terminal", "High-Speed Lan"];
        if (col % 2 === 0) features.push("Charging");
      }

      seats.push({
        id: `${row}-${col.toString().padStart(2, "0")}`,
        row,
        col,
        zone,
        features,
        status: st,
        student: st === "occupied" ? ["Aryan K.", "Priya S.", "Rahul M.", "Divya P.", "Karan T.", "Meera J."][Math.floor(Math.random() * 6)] : null,
        studentId: st === "occupied" ? "STU-RAND-" + (idx % 6) : null,
        checkIn: st === "occupied" ? Date.now() - Math.floor(Math.random() * 5400000) : null,
        awayStart: st === "away" ? Date.now() - Math.floor(Math.random() * 600000) : null,
        violations: Math.floor(Math.random() * 3),
      });
      idx++;
    }
  });
  return seats;
})();

const LEADERBOARD = [
  { name: "Aryan K.", hours: 42, badge: "Library Legend", streak: 12 },
  { name: "Priya S.", hours: 39, badge: "Focus Master", streak: 9 },
  { name: "Rahul M.", hours: 36, badge: "Time Keeper", streak: 7 },
  { name: "Divya P.", hours: 31, badge: "Early Bird", streak: 5 },
  { name: "Karan T.", hours: 28, badge: "Study Guru", streak: 4 },
  { name: "Meera J.", hours: 24, badge: "Night Owl", streak: 3 },
];

const BADGE_ICONS = {
  "Library Legend": "🏆",
  "Focus Master": "📚",
  "Time Keeper": "⏰",
  "Early Bird": "🌅",
  "Study Guru": "🎓",
  "Night Owl": "🦉"
};

const PEAK_DATA = [
  { hour: "6AM", pct: 10 }, { hour: "7AM", pct: 22 }, { hour: "8AM", pct: 45 }, { hour: "9AM", pct: 78 },
  { hour: "10AM", pct: 92 }, { hour: "11AM", pct: 88 }, { hour: "12PM", pct: 65 }, { hour: "1PM", pct: 70 },
  { hour: "2PM", pct: 82 }, { hour: "3PM", pct: 87 }, { hour: "4PM", pct: 75 }, { hour: "5PM", pct: 58 },
  { hour: "6PM", pct: 44 }, { hour: "7PM", pct: 55 }, { hour: "8PM", pct: 72 }, { hour: "9PM", pct: 60 },
  { hour: "10PM", pct: 30 }, { hour: "11PM", pct: 12 },
];



function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m ${s % 60}s`;
}

function varColor(hex) {
  return hex === C.green ? "rgba(16, 185, 129, 0.06)" : hex === C.amber ? "rgba(245, 158, 11, 0.06)" : hex === C.red ? "rgba(239, 68, 68, 0.06)" : "rgba(205, 160, 82, 0.04)";
}

function fmtClock(ms) {
  const tot = Math.floor(ms / 1000);
  const h = Math.floor(tot / 3600);
  const m = Math.floor((tot % 3600) / 60);
  const s = tot % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const C = {
  bg: "#050505",
  surface: "#0a0a0a",
  card: "#0f0f0f",
  border: "#1f1f1f",
  cyan: "#cda052",
  cyanDim: "#b58d46",
  amber: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  purple: "#6e8294",
  text: "#f5f5f7",
  muted: "#6e6e73",
  navyLight: "#161616",
};

// ── Components ──────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.icon && <span>{t.icon}</span>}
          <div>{t.msg}</div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QRPattern({ deskId }) {
  const cells = [];
  const seed = deskId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const fill = ((r * 7 + c + seed) % 3) === 0 || (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
      if (fill) {
        cells.push(<rect key={`${r}-${c}`} x={20 + c * 17} y={20 + r * 17} width={14} height={14} rx={2.5} fill={C.cyan} />);
      }
    }
  }
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {cells}
      <text x="70" y="132" textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="var(--font-mono)" fontWeight="700">{deskId}</text>
    </svg>
  );
}

function AnimatedMapBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseCanvasX = -1000;
    let mouseCanvasY = -1000;
    let scrollY = window.scrollY;

    let isHolding = false;
    let heldChairIndex = -1;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX - window.innerWidth / 2);
      targetMouseY = (e.clientY - window.innerHeight / 2);
      mouseCanvasX = e.clientX;
      mouseCanvasY = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        isHolding = true;
        mouseCanvasX = e.clientX;
        mouseCanvasY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isHolding = false;
      heldChairIndex = -1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Initialize 45 flowing seats
    const chairs = [];
    const randColor = () => {
      const r = Math.random();
      if (r < 0.50) return { r: 16, g: 185, b: 129 }; // Green (Free)
      if (r < 0.85) return { r: 239, g: 68, b: 68 };  // Red (Occupied)
      return { r: 245, g: 158, b: 11 };               // Yellow (Away)
    };

    for (let i = 0; i < 45; i++) {
      const color = randColor();
      chairs.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 1600,
        baseZ: Math.random() * 100 + 20,
        z: 20,
        vx: -0.4 - Math.random() * 0.4, // drift velocity leftwards
        vy: (Math.random() - 0.5) * 0.1,  // drift velocity vertical (slow)
        rot: Math.random() * Math.PI * 2,
        spinSpeed: 0.003 + Math.random() * 0.005,
        bobPhase: Math.random() * Math.PI * 2,
        bobAmp: 8 + Math.random() * 10,
        r: color.r,
        g: color.g,
        b: color.b,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const centerX = width / 2;
      const centerY = (height / 1.65) - scrollY * 0.35; // Scroll parallax
      const fov = 1000;

      // Base camera tilt (Isometric angle) + mouse rotation
      const baseAngleX = 0.58;  // Camera tilt
      const baseAngleY = -0.78; // Camera yaw
      const rotX = baseAngleX + mouseY * 0.00015;
      const rotY = baseAngleY + mouseX * 0.00015;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Projection mapping 3D to 2D
      const project = (x, y, z) => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const depth = z2 + 1150; // Camera offset
        const scale = fov / Math.max(10, depth);
        const px = centerX + x1 * scale;
        const py = centerY + y1 * scale;
        return { x: px, y: py, scale, depth };
      };

      const projectRotated = (cx, cy, cz, lx, ly, lz, cosT, sinT) => {
        const rx = lx * cosT - ly * sinT;
        const ry = lx * sinT + ly * cosT;
        return project(cx + rx, cy + ry, cz + lz);
      };

      // 1. Update and Project Chairs
      const renderList = [];
      const cullMargin = 200; // larger cull margin for larger chairs
      const time = Date.now() * 0.001;

      // Find closest chair to mouse if user clicked to hold but no leader selected
      if (isHolding && heldChairIndex === -1 && mouseCanvasX > -1000) {
        let minDistance = Infinity;
        for (let i = 0; i < chairs.length; i++) {
          const chair = chairs[i];
          const proj = project(chair.x, chair.y, chair.z);
          const dx = proj.x - mouseCanvasX;
          const dy = proj.y - mouseCanvasY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            heldChairIndex = i;
          }
        }
      }

      for (let i = 0; i < chairs.length; i++) {
        const chair = chairs[i];

        // Update positions
        let targetX;
        let targetY;
        let targetZ;

        if (isHolding && heldChairIndex !== -1) {
          const leader = chairs[heldChairIndex];
          if (i === heldChairIndex) {
            // Leader follows mouse projection in 3D
            const mouse3DX = (mouseCanvasX - centerX) * 1.35;
            const mouse3DY = (mouseCanvasY - centerY) * 1.6;
            targetX = chair.x + (mouse3DX - chair.x) * 0.15;
            targetY = chair.y + (mouse3DY - chair.y) * 0.15;
            targetZ = chair.z + (60 - chair.z) * 0.15;
          } else {
            // Swarm gravitation towards leader
            const dx = leader.x - chair.x;
            const dy = leader.y - chair.y;
            const dz = leader.z - chair.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
            
            const pullSpeed = 7.5;
            targetX = chair.x + (dx / dist) * pullSpeed;
            targetY = chair.y + (dy / dist) * pullSpeed;
            targetZ = chair.z + (dz / dist) * pullSpeed;

            // Swarm separation repulsion
            for (let j = 0; j < chairs.length; j++) {
              if (i === j) continue;
              const other = chairs[j];
              const sx = other.x - chair.x;
              const sy = other.y - chair.y;
              const sz = other.z - chair.z;
              const sdist = Math.sqrt(sx * sx + sy * sy + sz * sz) + 0.1;
              const minSeparation = 85;
              if (sdist < minSeparation) {
                const repulse = (minSeparation - sdist) * 0.15;
                targetX -= (sx / sdist) * repulse;
                targetY -= (sy / sdist) * repulse;
                targetZ -= (sz / sdist) * repulse;
              }
            }
          }
        } else {
          // Normal drift motion
          targetX = chair.x + chair.vx;
          targetY = chair.y + chair.vy + Math.sin(time + chair.bobPhase) * 0.05;
          targetZ = chair.baseZ + Math.sin(time * 1.3 + chair.bobPhase) * chair.bobAmp;
        }

        chair.x = targetX;
        chair.y = targetY;
        chair.z = targetZ;

        // Wrapping (only when not holding)
        if (!isHolding && chair.x < -1000) {
          chair.x = 1000;
          chair.y = (Math.random() - 0.5) * 1600;
          const color = randColor();
          chair.r = color.r;
          chair.g = color.g;
          chair.b = color.b;
          chair.baseZ = Math.random() * 100 + 20;
        }

        // Project center for hover and culling check
        const projCenter = project(chair.x, chair.y, chair.z);

        if (
          projCenter.x < -cullMargin ||
          projCenter.x > width + cullMargin ||
          projCenter.y < -cullMargin ||
          projCenter.y > height + cullMargin
        ) {
          continue;
        }

        // Proximity hover calculation
        let hoverIntensity = 0;
        if (mouseCanvasX > -1000) {
          const dx = projCenter.x - mouseCanvasX;
          const dy = projCenter.y - mouseCanvasY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 220) {
            const factor = 1 - dist / 220;
            hoverIntensity = Math.pow(factor, 1.5);
          }
        }

        // Force full glow on held leader chair
        if (isHolding && i === heldChairIndex) {
          hoverIntensity = 1.0;
        }

        // Apply rotation update based on hover speedup
        const speedMultiplier = 1 + hoverIntensity * 3.5;
        chair.rot += chair.spinSpeed * speedMultiplier;

        renderList.push({
          chair,
          hoverIntensity,
          depth: projCenter.depth,
          scale: projCenter.scale,
        });
      }

      // 2. Depth Sort Chairs
      renderList.sort((a, b) => b.depth - a.depth);

      // Helper to draw single face
      const drawFace = (p1, p2, p3, p4, fillStyle, strokeStyle, lineWidth) => {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        if (fillStyle) {
          ctx.fillStyle = fillStyle;
          ctx.fill();
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      // 3. Render Chairs
      for (let i = 0; i < renderList.length; i++) {
        const { chair, hoverIntensity, depth, scale } = renderList[i];
        
        const cosT = Math.cos(chair.rot);
        const sinT = Math.sin(chair.rot);

        const r = chair.r;
        const g = chair.g;
        const b = chair.b;

        const scaleFactor = scale || 1;
        const depthOpacity = Math.max(0, Math.min(0.85, (1.35 - depth / 1400)));

        // Cushion (lower box):
        // local coords: x [-15, 15], y [-15, 15], z [0, 9] (50% scaled up)
        const cT0 = projectRotated(chair.x, chair.y, chair.z, -15, -15, 9, cosT, sinT);
        const cT1 = projectRotated(chair.x, chair.y, chair.z,  15, -15, 9, cosT, sinT);
        const cT2 = projectRotated(chair.x, chair.y, chair.z,  15,  15, 9, cosT, sinT);
        const cT3 = projectRotated(chair.x, chair.y, chair.z, -15,  15, 9, cosT, sinT);

        const cB0 = projectRotated(chair.x, chair.y, chair.z, -15, -15, 0, cosT, sinT);
        const cB1 = projectRotated(chair.x, chair.y, chair.z,  15, -15, 0, cosT, sinT);
        const cB2 = projectRotated(chair.x, chair.y, chair.z,  15,  15, 0, cosT, sinT);
        const cB3 = projectRotated(chair.x, chair.y, chair.z, -15,  15, 0, cosT, sinT);

        // Backrest (back box):
        // local coords: x [-15, 15], y [-15, -10], z [9, 26] (50% scaled up)
        const bT0 = projectRotated(chair.x, chair.y, chair.z, -15, -15, 26, cosT, sinT);
        const bT1 = projectRotated(chair.x, chair.y, chair.z,  15, -15, 26, cosT, sinT);
        const bT2 = projectRotated(chair.x, chair.y, chair.z,  15, -10, 26, cosT, sinT);
        const bT3 = projectRotated(chair.x, chair.y, chair.z, -15, -10, 26, cosT, sinT);

        const bB0 = projectRotated(chair.x, chair.y, chair.z, -15, -15, 9, cosT, sinT);
        const bB1 = projectRotated(chair.x, chair.y, chair.z,  15, -15, 9, cosT, sinT);
        const bB2 = projectRotated(chair.x, chair.y, chair.z,  15, -10, 9, cosT, sinT);
        const bB3 = projectRotated(chair.x, chair.y, chair.z, -15, -10, 9, cosT, sinT);

        // Alpha & Shading calculations
        const fillAlpha = (0.04 + hoverIntensity * 0.18) * depthOpacity;
        const strokeAlpha = (0.15 + hoverIntensity * 0.6) * depthOpacity;
        const strokeColor = `rgba(${r}, ${g}, ${b}, ${strokeAlpha})`;
        const strokeWidth = (0.7 + hoverIntensity * 0.7) * Math.min(2.0, scaleFactor * 0.85);

        const getFill = (factor) => `rgba(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)}, ${fillAlpha})`;

        // Compile Cushion and Backrest faces
        const faces = [
          // Cushion
          { pts: [cT0, cT1, cT2, cT3], fill: getFill(1.0) },   // Top
          { pts: [cB3, cT3, cT2, cB2], fill: getFill(0.65) },  // Front
          { pts: [cB0, cT0, cT1, cB1], fill: getFill(0.8) },   // Back
          { pts: [cB0, cT0, cT3, cB3], fill: getFill(0.8) },   // Left
          { pts: [cB1, cT1, cT2, cB2], fill: getFill(0.65) },  // Right

          // Backrest
          { pts: [bT0, bT1, bT2, bT3], fill: getFill(1.0) },   // Top
          { pts: [bB3, bT3, bT2, bB2], fill: getFill(0.65) },  // Front
          { pts: [bB0, bT0, bT1, bB1], fill: getFill(0.8) },   // Back
          { pts: [bB0, bT0, bT3, bB3], fill: getFill(0.8) },   // Left
          { pts: [bB1, bT1, bT2, bB2], fill: getFill(0.65) },  // Right
        ];

        // Depth sort faces of this chair (painter's algorithm inside single chair coordinate space)
        faces.forEach(face => {
          face.avgDepth = (face.pts[0].depth + face.pts[1].depth + face.pts[2].depth + face.pts[3].depth) / 4;
        });
        faces.sort((a, b) => b.avgDepth - a.avgDepth);

        // Draw sorted faces
        for (let j = 0; j < faces.length; j++) {
          const face = faces[j];
          drawFace(face.pts[0], face.pts[1], face.pts[2], face.pts[3], face.fill, strokeColor, strokeWidth);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.95
      }}
    />
  );
}

// ── Landing Page ────────────────────────────────────────────
function LandingPage({ onLogin, seats }) {
  const free = seats.filter(s => s.status === "free").length;
  const occ = seats.filter(s => s.status === "occupied").length;
  const away = seats.filter(s => s.status === "away").length;
  const pct = Math.round((occ + away) / seats.length * 100);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedMapBg seats={seats} />
      {/* Hero */}
      <div className="hero">
        <div className="hero-text">
          <div className="hero-badge">
            <i className="ti ti-sparkles" style={{ marginRight: 5 }}></i>
            Smart Presence Check
          </div>
          <h1 className="hero-title">
            Scan. Verify.<br />
            <span>Know your</span><br />
            seat.
          </h1>
          <p className="hero-sub">
            Fair, transparent library seat management. Snap the desk QR code, verify presence, and enjoy uninterrupted study sessions without seat hoarding.
          </p>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => onLogin("student")} style={{ fontSize: 14, padding: "12px 32px" }}>
              <i className="ti ti-scan"></i> Find a Seat
            </button>
            <a href="#features" className="btn btn-outline" style={{ fontSize: 14, padding: "12px 32px" }}>
              Features ↗
            </a>
          </div>
        </div>

        {/* Live Camera Scanner Mockup Card */}
        <div className="mockup-card">
          <div className="mockup-header">
            <div className="traffic-dots">
              <span style={{ background: "#ff5f57" }}></span>
              <span style={{ background: "#febc2e" }}></span>
              <span style={{ background: "#28c840" }}></span>
            </div>
            <span className="mockup-label">DeskGuard — Live Scan</span>
          </div>
          <div className="mockup-viewport">
            <div className="scan-line" />
            <div className="corners">
              <div className="corner c-tl" />
              <div className="corner c-tr" />
              <div className="corner c-bl" />
              <div className="corner c-br" />
            </div>
            <div className="mockup-icon">🪑</div>
            <div className="viewport-label">Verifying presence...</div>
          </div>
          <div className="result-bar">
            <div className="result-cell">
              <span className="result-val">A-01</span>
              <span className="result-key">Desk ID</span>
            </div>
            <div className="result-cell">
              <span className="result-val" style={{ color: C.cyan }}>Active</span>
              <span className="result-key">Status</span>
            </div>
            <div className="result-cell">
              <span className="result-val">42m</span>
              <span className="result-key">Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live System stats */}
      <div style={{ maxWidth: 1100, margin: "0 auto 40px", padding: "0 24px" }}>
        <div className="live-stats" style={{ margin: "0 auto" }}>
          <div className="live-stat">
            <span className="live-dot green" style={{ width: 8, height: 8 }} />
            <span className="live-stat-num" style={{ color: C.green }}>{free}</span>
            <span className="live-stat-label">Available</span>
          </div>
          <div className="live-stat" style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 30 }}>
            <span className="live-dot" style={{ background: C.red, width: 8, height: 8 }} />
            <span className="live-stat-num" style={{ color: C.red }}>{occ}</span>
            <span className="live-stat-label">Occupied</span>
          </div>
          <div className="live-stat" style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 30 }}>
            <span className="live-dot" style={{ background: C.amber, width: 8, height: 8 }} />
            <span className="live-stat-num" style={{ color: C.amber }}>{away}</span>
            <span className="live-stat-label">Away</span>
          </div>
          <div className="live-stat" style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 30 }}>
            <span className="live-dot" style={{ background: C.cyan, width: 8, height: 8 }} />
            <span className="live-stat-num" style={{ color: C.cyan }}>{pct}%</span>
            <span className="live-stat-label">Utilization</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="section" id="features" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "2px", color: C.cyan, fontWeight: 700 }}>Built for Fairness</span>
        </div>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 40, letterSpacing: "-0.5px" }}>Every Feature Engineered to End Seat Hoarding</h2>
        <div className="feature-grid">
          {[
            { 
              icon: "ti ti-map-2", 
              title: "Live Seat Map", 
              desc: "Interactive, high-fidelity SVG floorplan updates in real-time. See exactly what is free, occupied, or away.",
              steps: [
                "Open the live floorplan map on your portal.",
                "View real-time color-coded seat occupancy.",
                "Click a free green desk to reserve it instantly."
              ]
            },
            { 
              icon: "ti ti-qrcode", 
              title: "QR Check-In", 
              desc: "Students scan the desk's physical QR code to verify presence. No scan means the seat remains public.",
              steps: [
                "Locate your designated study desk.",
                "Scan the physical QR code with your mobile.",
                "Tap verify within 10 minutes to activate."
              ]
            },
            { 
              icon: "ti ti-coffee", 
              title: "Away Breaks", 
              desc: "Need a coffee break? Toggle Away Mode. You get 20 minutes before your desk is auto-released.",
              steps: [
                "Toggle Away Break on your portal.",
                "System locks your seat for 20 minutes.",
                "Return & tap resume to secure the seat."
              ]
            },
            { 
              icon: "ti ti-shield-check", 
              title: "Anti-Hoarding Checks", 
              desc: "System auto-prompts occupied desks periodically. Fail to respond within 5 mins, and the desk resets.",
              steps: [
                "Random checks trigger during peak hours.",
                "Receive presence prompts on dashboard.",
                "Tap confirm within 5 mins to keep desk."
              ]
            },
            { 
              icon: "ti ti-chart-bar", 
              title: "Analytics Console", 
              desc: "Track peak utilization hours, occupancy heatmaps, average study duration, and high-demand zones.",
              steps: [
                "System logs live occupancy check-ins.",
                "Compiles peak hours utilization metrics.",
                "Provides data to optimize study times."
              ]
            },
            { 
              icon: "ti ti-alert-triangle", 
              title: "Incident Logging", 
              desc: "Easily report broken outlets or noise disturbances directly from your seat for instant admin resolution.",
              steps: [
                "Open incident logger at your desk.",
                "Select defect type (power, noise, damage).",
                "Sends ticket directly to Admin dashboard."
              ]
            },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="card-normal-content">
                <div className="feature-icon"><i className={f.icon}></i></div>
                <h3 className="feature-title" style={{ fontFamily: "var(--font-heading)" }}>{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
              <div className="card-hover-content">
                <h4 className="hover-workflow-title">How It Works</h4>
                <ol className="hover-workflow-list">
                  {f.steps.map((step, idx) => (
                    <li key={idx} className="hover-workflow-item">
                      <span className="step-num">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Login Page ──────────────────────────────────────────────
function LoginPage({ onLogin, addToast }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("student");

  const handleVerifyLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: "warn", icon: "⚠️", msg: "Please enter your full name." });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      addToast({ type: "warn", icon: "✉️", msg: "Please enter a valid university email address." });
      return;
    }
    onLogin(mode, name);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-glow-1" />
        <div className="login-glow-2" />
      </div>
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 8, fontFamily: "var(--font-heading)" }}>Welcome to DeskGuard</h2>
          <p style={{ fontSize: 13, color: C.muted }}>Sign in to reserve your study workspace</p>
        </div>
        <div className="login-tab-container">
          {["student", "admin"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`login-tab-btn ${mode === m ? "active" : ""}`}
            >
              {m === "student" ? "Student" : "Admin"}
            </button>
          ))}
        </div>
        <form onSubmit={handleVerifyLogin} style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <input
            className="input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ fontSize: 14, padding: "12px 16px" }}
          />
          <input
            className="input"
            type="email"
            placeholder={mode === "student" ? "student@university.edu" : "admin@library.edu"}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ fontSize: 14, padding: "12px 16px" }}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            required
            style={{ fontSize: 14, padding: "12px 16px" }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: 14 }}>
            {mode === "student" ? "Open Student Portal →" : "Access Admin Console →"}
          </button>
        </form>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.muted }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <button className="btn" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, width: "100%", padding: "12px", fontSize: 13 }} onClick={() => onLogin(mode, name || "SSO Scholar")}>
            🎓 Single Sign-On (SSO)
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Library Map ─────────────────────────────────────────────
function LibraryMap({ seats, onSeatClick, currentDeskId }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = seats.filter(s => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const seatIds = new Set(filtered.map(s => s.id));

  const SECTIONS = [
    { title: "📚 Reading Hall (Quiet Study Zone)", rows: ["A", "B"] },
    { title: "📖 Books Stock Area (Study Alcoves)", rows: ["C"] },
    { title: "💻 Digital Library (PC & LAN Terminals)", rows: ["D", "F"] },
    { title: "👥 Discussion Rooms & Periodicals", rows: ["E"] },
  ];

  return (
    <div id="seating-floorplan">
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
        <input 
          className="input" 
          placeholder="Search desk (e.g. A-03)" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ width: 220 }} 
        />
        {["all", "free", "occupied", "away"].map(f => (
          <button 
            key={f} 
            className={`filter-pill ${filter === f ? "active" : ""}`} 
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Desks" : f === "free" ? "🟢 Free" : f === "occupied" ? "🔴 Occupied" : "🟡 Away"}
          </button>
        ))}
        <button 
          className="btn btn-sm btn-outline" 
          style={{ marginLeft: "auto" }}
          onClick={() => { setSearch(""); setFilter("all"); }}
        >
          Reset Filters
        </button>
      </div>
      
      {/* Seating Map Card */}
      <div className="cinema-map-container">
        {SECTIONS.map((section) => (
          <div key={section.title} className="cinema-section">
            <div className="cinema-section-title">{section.title}</div>
            
            {section.rows.map((row) => {
              const rowSeats = seats.filter(s => s.row === row).sort((a, b) => a.col - b.col);
              const leftBlock = rowSeats.slice(0, 3);
              const rightBlock = rowSeats.slice(3, 6);
              
              return (
                <div key={row} className="cinema-row">
                  <div className="cinema-row-label">{row}</div>
                  
                  {/* Left Block (Seats 01 - 03) */}
                  <div className="cinema-seat-block">
                    {leftBlock.map(seat => {
                      const isFiltered = !seatIds.has(seat.id);
                      const isMySeat = seat.id === currentDeskId;
                      const statusClass = isMySeat ? "my-seat" : seat.status;
                      
                      return (
                        <div 
                          key={seat.id} 
                          className={`cinema-seat ${statusClass} ${isFiltered ? "filtered-out" : ""}`}
                          onClick={() => onSeatClick(seat)}
                          title={`${seat.id} (${seat.zone}): ${seat.status}`}
                        >
                          <span>{seat.col.toString().padStart(2, "0")}</span>
                          <div className="cinema-seat-features">
                            {seat.features.includes("Charging") && <span className="cinema-feature-dot" title="Power Outlet">⚡</span>}
                            {seat.features.includes("Window View") && <span className="cinema-feature-dot" title="Window View">🪟</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Center Aisle */}
                  <div className="cinema-aisle" />
                  
                  {/* Right Block (Seats 04 - 06) */}
                  <div className="cinema-seat-block">
                    {rightBlock.map(seat => {
                      const isFiltered = !seatIds.has(seat.id);
                      const isMySeat = seat.id === currentDeskId;
                      const statusClass = isMySeat ? "my-seat" : seat.status;
                      
                      return (
                        <div 
                          key={seat.id} 
                          className={`cinema-seat ${statusClass} ${isFiltered ? "filtered-out" : ""}`}
                          onClick={() => onSeatClick(seat)}
                          title={`${seat.id} (${seat.zone}): ${seat.status}`}
                        >
                          <span>{seat.col.toString().padStart(2, "0")}</span>
                          <div className="cinema-seat-features">
                            {seat.features.includes("Charging") && <span className="cinema-feature-dot" title="Power Outlet">⚡</span>}
                            {seat.features.includes("Window View") && <span className="cinema-feature-dot" title="Window View">🪟</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Cinema-Style Map Legend */}
        <div className="cinema-legend">
          <div className="cinema-legend-item">
            <div className="cinema-legend-icon free" />
            <span>Available</span>
          </div>
          <div className="cinema-legend-item">
            <div className="cinema-legend-icon occupied" />
            <span>Occupied</span>
          </div>
          <div className="cinema-legend-item">
            <div className="cinema-legend-icon selected" />
            <span>Your Seat</span>
          </div>
          <div className="cinema-legend-item">
            <div className="cinema-legend-icon away" />
            <span>Away Break</span>
          </div>
          <div className="cinema-legend-item">
            <div className="cinema-legend-icon abandoned" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1.5px solid rgba(239, 68, 68, 0.2)" }} />
            <span>Abandoned</span>
          </div>
          <div className="cinema-legend-item">
            <div className="cinema-legend-icon occupied" style={{ border: "1.5px dashed var(--border)" }} />
            <span>Maintenance</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Dashboard ───────────────────────────────────────
function StudentDashboard({ seats, setSeats, addToast, user, notifications, leaderboard }) {
  const [tab, setTab] = useState("map");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [awayModal, setAwayModal] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [awayTime, setAwayTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const myDesk = seats.find(s => s.studentId === user.id);

  const handleFindSeatClick = () => {
    setTab("map");
    setTimeout(() => {
      const mapEl = document.getElementById("seating-floorplan");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };

  // Monitor clock timers
  useEffect(() => {
    const id = setInterval(() => {
      if (myDesk?.checkIn) setSessionTime(Date.now() - myDesk.checkIn);
      if (myDesk?.awayStart) setAwayTime(Date.now() - myDesk.awayStart);
    }, 1000);
    return () => clearInterval(id);
  }, [myDesk]);

  // Dynamic leaderboard calculation (simulating 1 minute active QR session = 1 hour study)
  const displayLeaderboard = useMemo(() => {
    const activeHoursSim = (myDesk && myDesk.status === "occupied" && myDesk.checkIn) ? (sessionTime / 60000) : 0;
    const userHours = 25.5 + activeHoursSim;
    const userEntry = {
      name: user.name,
      hours: parseFloat(userHours.toFixed(2)),
      badge: "Focus Master",
      streak: 4,
      isCurrentUser: true
    };
    const others = leaderboard.filter(l => l.name !== user.name);
    const list = [...others, userEntry];
    return list.sort((a, b) => b.hours - a.hours);
  }, [leaderboard, user.name, myDesk, sessionTime]);

  // Background job: auto-expire away timers
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const expiredSeats = seats.filter(s => s.status === "away" && s.awayStart && now - s.awayStart > 1200000);
      if (expiredSeats.length > 0) {
        expiredSeats.forEach(s => {
          addToast({
            type: "error",
            icon: "🚨",
            title: "Desk Auto-Released",
            msg: `Desk ${s.id} (occupied by ${s.student || "Unknown"}) was auto-released due to inactivity.`
          });
        });
        setSeats(prev => prev.map(s => {
          if (s.status === "away" && s.awayStart && now - s.awayStart > 1200000) {
            return { ...s, status: "abandoned", student: null, studentId: null, checkIn: null, awayStart: null };
          }
          return s;
        }));
      }
    }, 10000);
    return () => clearInterval(id);
  }, [seats, addToast, setSeats]);

  const reserveSeat = (seat) => {
    setSeats(prev => prev.map(s => s.id === seat.id ? {
      ...s, status: "reserved", student: user.name, studentId: user.id, checkIn: null, awayStart: null
    } : s));
    addToast({ 
      type: "success", 
      icon: "⏳", 
      title: "Reservation Pending", 
      msg: `Desk ${seat.id} reserved by ${user.name}! Verify presence inside the QR Check-in tab within 10 minutes.` 
    });
    setSelectedSeat(null);
  };

  const handleSimulateScan = () => {
    if (!myDesk) return;
    setIsScanning(true);
    addToast({ type: "info", icon: "⚡", msg: "Simulating camera scanning the desk's physical QR code..." });
    setTimeout(() => {
      setIsScanning(false);
      setSeats(prev => prev.map(s => s.id === myDesk.id ? { ...s, status: "occupied", checkIn: Date.now() } : s));
      addToast({ 
        type: "success", 
        icon: "✅", 
        title: "Session Activated", 
        msg: `Desk ${myDesk.id} verified via QR code for student ${user.name}.` 
      });
    }, 1500);
  };

  const goAway = () => {
    if (!myDesk) return;
    setSeats(prev => prev.map(s => s.id === myDesk.id ? { ...s, status: "away", awayStart: Date.now() } : s));
    addToast({ 
      type: "warn", 
      icon: "🟡", 
      title: "Away Mode Started", 
      msg: `Student ${user.name} went away from Desk ${myDesk.id}. 20 minutes remaining.` 
    });
    setAwayModal(false);
  };

  const returnToDesk = () => {
    if (!myDesk) return;
    setSeats(prev => prev.map(s => s.id === myDesk.id ? { ...s, status: "occupied", awayStart: null } : s));
    addToast({ 
      type: "success", 
      icon: "✅", 
      title: "Session Resumed", 
      msg: `Student ${user.name} returned to Desk ${myDesk.id}.` 
    });
  };

  const releaseDesk = () => {
    if (!myDesk) return;
    const releasedId = myDesk.id;
    setSeats(prev => prev.map(s => s.id === releasedId ? { ...s, status: "free", student: null, studentId: null, checkIn: null, awayStart: null } : s));
    addToast({ 
      type: "info", 
      icon: "🔓", 
      title: "Desk Released", 
      msg: `Student ${user.name} released Desk ${releasedId}.` 
    });
    setConfirmModal(null);
  };

  const free = seats.filter(s => s.status === "free").length;
  const occ = seats.filter(s => s.status === "occupied").length;
  const pct = Math.round((occ) / seats.length * 100);

  return (
    <div className="section" style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Welcome banner */}
      <div className="card" style={{ marginBottom: 30, background: `linear-gradient(135deg, rgba(205, 160, 82, 0.04), rgba(110, 130, 148, 0.04))`, border: `1px solid rgba(205, 160, 82, 0.12)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Welcome back, {user.name} 👋</div>
            <div style={{ fontSize: 13, color: C.muted, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
              <span>📚 Occupancy: <span style={{ color: pct > 80 ? C.red : pct > 60 ? C.amber : C.green, fontWeight: 700 }}>{pct}% full</span></span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.border }} />
              <span>🟢 {free} seats available</span>
              {myDesk && (
                <>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.border }} />
                  <span>⏱️ Session: <span style={{ fontFamily: "var(--font-mono)", color: C.cyan, fontWeight: 700 }}>{fmtClock(sessionTime)}</span></span>
                </>
              )}
            </div>
          </div>
          {myDesk ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div className="badge badge-purple" style={{ fontSize: 12 }}>🪑 Desk {myDesk.id}</div>
              {myDesk.status === "away" ? (
                <button className="btn btn-sm btn-primary" onClick={returnToDesk}>Return to Desk</button>
              ) : (
                <button className="btn btn-sm btn-amber" onClick={() => setAwayModal(true)}>Break Timer</button>
              )}
              <button className="btn btn-sm btn-danger" onClick={() => setConfirmModal("release")}>Release</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleFindSeatClick}>Find a Seat →</button>
          )}
        </div>
        {myDesk?.status === "away" && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: 10 }}>
            <span style={{ color: C.amber, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="live-dot" style={{ background: C.amber }} />
              Away mode active — {fmtClock(Math.max(0, 1200000 - awayTime))} remaining before release.
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: "map", label: "🗺️ Seat Floorplan" },
          { id: "checkin", label: "📱 QR Check-In" },
          { id: "notifs", label: "🔔 Alerts feed" },
          { id: "leaderboard", label: "🏆 Study Champions" },
          { id: "recommend", label: "✨ Smart suggestions" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`dashboard-tab ${tab === t.id ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-view-container" key={tab}>
        {tab === "map" && (
          <LibraryMap seats={seats} currentDeskId={myDesk?.id} onSeatClick={(s) => {
            if (s.status === "free") setSelectedSeat(s);
            else if (s.id === myDesk?.id) addToast({ type: "info", icon: "📍", msg: "This is your current reserved desk!" });
            else addToast({ type: "warn", icon: "🔒", msg: `Desk ${s.id} is currently ${s.status}.` });
          }} />
        )}

        {tab === "checkin" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>📱 QR Verification Code</h3>
              {myDesk ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div className="qr-container">
                    <div className="scanner-line" style={{ animationPlayState: isScanning ? "running" : "paused" }} />
                    <QRPattern deskId={myDesk.id} />
                  </div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 6 }}>Verify presence at Desk <span style={{ color: C.cyan }}>{myDesk.id}</span></div>
                  
                  {myDesk.status === "reserved" ? (
                    <>
                      <div className="badge badge-amber" style={{ margin: "0 auto 16px" }}>⏳ Pending QR Check-In</div>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: "100%", marginTop: 8 }}
                        onClick={handleSimulateScan}
                        disabled={isScanning}
                      >
                        {isScanning ? "Scanning QR Code..." : "⚡ Scan & Verify Desk"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="badge badge-green" style={{ margin: "0 auto 16px" }}>✓ Reservation Checked-In</div>
                      <div style={{ padding: "16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Time Active</div>
                        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-mono)", color: C.cyan }}>{fmtClock(sessionTime)}</div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🪑</div>
                  <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>No active seat reservation. Reserve a seat to access check-in.</div>
                  <button className="btn btn-primary" onClick={() => setTab("map")}>Go to floorplan</button>
                </div>
              )}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>📋 Current Session Data</h3>
              {myDesk ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: "Desk Identifier", val: myDesk.id, mono: true },
                    { label: "Designated Zone", val: myDesk.zone },
                    { label: "Workspace Features", val: myDesk.features.join(", ") },
                    { label: "Active Status", val: myDesk.status, badge: true },
                    { label: "Check-in Timestamp", val: myDesk.checkIn ? new Date(myDesk.checkIn).toLocaleTimeString() : "Pending Verification" },
                    { label: "Session Duration", val: myDesk.checkIn ? fmtTime(sessionTime) : "Not Active" },
                    { label: "Student ID", val: user.id, mono: true },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{r.label}</span>
                      {r.badge ? (
                        <span className={`badge badge-${myDesk.status === "occupied" ? "green" : myDesk.status === "away" ? "amber" : "cyan"}`}>{r.val}</span>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: r.mono ? "var(--font-mono)" : "inherit", color: C.text }}>{r.val}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: C.muted, fontSize: 13, padding: 10 }}>No active session found.</div>}
            </div>
          </div>
        )}

        {tab === "notifs" && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>🔔 Alerts & Activity Feed</h3>
            <div>
              {notifications.map(n => (
                <div key={n.id} className="notif">
                  <div className="notif-icon" style={{ background: n.type === "success" ? varColor(C.green) : n.type === "warn" ? varColor(C.amber) : n.type === "error" ? varColor(C.red) : varColor(C.cyan) }}>
                    {n.icon}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-desc">{n.body}</div>
                  </div>
                  <div className="notif-time">{n.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🏆 Consistency Champions</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Weekly Leaderboard — rewarding consistent and responsible library use.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {displayLeaderboard.map((l, i) => (
                <div 
                  key={l.name} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 16, 
                    padding: "12px 16px", 
                    background: l.isCurrentUser 
                      ? "rgba(205, 160, 82, 0.08)" 
                      : (i === 0 ? "rgba(245, 158, 11, 0.02)" : "transparent"), 
                    borderRadius: 10, 
                    border: l.isCurrentUser 
                      ? "1px solid rgba(205, 160, 82, 0.3)" 
                      : (i === 0 ? `1px solid rgba(245,158,11,0.08)` : `1px solid transparent`) 
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg, #ffd700, #ff9f00)" : i === 1 ? "linear-gradient(135deg, #cbd5e1, #94a3b8)" : i === 2 ? "linear-gradient(135deg, #b45309, #78350f)" : "rgba(30,41,59,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: i < 3 ? C.bg : C.text, border: i < 3 ? "none" : `1px solid ${C.border}` }}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      {l.name}
                      {l.isCurrentUser && <span className="badge badge-cyan" style={{ fontSize: 9, padding: "2px 6px" }}>You</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{BADGE_ICONS[l.badge] || "🎓"} {l.badge} · {l.streak} day streak</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: i === 0 ? C.amber : C.text }}>{l.hours} hrs</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>accumulated</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "recommend" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>✨ Personalized Suggestions</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Based on your recent study habits and workspace parameters.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {seats.filter(s => s.status === "free").slice(0, 6).map(s => {
                const isPreviouslyUsed = (s.id.charCodeAt(0) + s.col) % 2 === 0;
                return (
                  <div key={s.id} className="card-sm" style={{ cursor: "pointer" }} onClick={() => { if (!myDesk) { reserveSeat(s); setTab("checkin"); } else addToast({ type: "warn", icon: "⚠️", msg: "You already have an active seat reservation." }); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: C.cyan }}>{s.id}</div>
                      <span className="badge badge-green" style={{ padding: "2px 8px", fontSize: 9 }}>Available</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 600 }}>{s.zone} Zone</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {s.features.map(f => (
                        <span key={f} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, fontWeight: 500 }}>
                          {f === "Charging" ? "⚡ " + f : f === "Window View" ? "🪟 " + f : "🔕 " + f}
                        </span>
                      ))}
                      {isPreviouslyUsed && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(205, 160, 82, 0.06)", border: `1px solid rgba(205, 160, 82, 0.15)`, color: C.cyan, fontWeight: 600 }}>✓ Previous Seat</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.cyan, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>Reserve Space →</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedSeat && (
        <Modal title={`Desk Reservation: ${selectedSeat.id}`} onClose={() => setSelectedSeat(null)}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span className="badge badge-green">✓ Ready to reserve</span>
              {selectedSeat.features.map(f => <span key={f} className="badge badge-cyan">{f === "Charging" ? "⚡" : f === "Window View" ? "🪟" : "🔕"} {f}</span>)}
            </div>
            <div style={{ background: C.surface, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Workspace Zone</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedSeat.zone} Floor Section</div>
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              By reserving, you agree to scan and check in within <strong>10 minutes</strong>. The system will prompt presence checks periodically.
            </p>
          </div>
          {myDesk ? (
            <div style={{ color: C.amber, fontSize: 13, fontWeight: 600, textAlign: "center" }}>⚠️ You already hold an active reservation at {myDesk.id}.</div>
          ) : (
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => reserveSeat(selectedSeat)}>
              Confirm Reservation {selectedSeat.id}
            </button>
          )}
        </Modal>
      )}
      {awayModal && (
        <Modal title="Break Timer / Away Break" onClose={() => setAwayModal(false)}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>☕</div>
            <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Leaving your workspace?</h4>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              We will hold your seat for up to <strong style={{ color: C.amber }}>20 minutes</strong>. If you do not check back in before the timer expires, the desk will be auto-released and flagged.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAwayModal(false)}>Cancel</button>
              <button className="btn btn-amber" style={{ flex: 1 }} onClick={goAway}>Start Timer</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmModal === "release" && (
        <Modal title="Release Workspace" onClose={() => setConfirmModal(null)}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>🔓</div>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to end your study session and release <strong style={{ color: C.text }}>Desk {myDesk?.id}</strong>? The space will instantly become available for others.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmModal(null)}>Keep Desk</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={releaseDesk}>Release Seat</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Admin Dashboard ──────────────────────────────────────────
function AdminDashboard({ seats, setSeats, addToast, notifications }) {
  const [tab, setTab] = useState("overview");
  const [selectedDesk, setSelectedDesk] = useState(null);

  const free = seats.filter(s => s.status === "free").length;
  const occ = seats.filter(s => s.status === "occupied").length;
  const away = seats.filter(s => s.status === "away").length;
  const abandoned = seats.filter(s => s.status === "abandoned").length;
  const violations = seats.reduce((sum, s) => sum + (s.violations || 0), 0);

  const resetDesk = (id) => {
    setSeats(prev => prev.map(s => s.id === id ? { ...s, status: "free", student: null, studentId: null, checkIn: null, awayStart: null } : s));
    addToast({ 
      type: "success", 
      icon: "✅", 
      title: "Workspace Reset", 
      msg: `Desk ${id} manually reset.` 
    });
    setSelectedDesk(null);
  };

  const markMaintenance = (id) => {
    setSeats(prev => prev.map(s => s.id === id ? { ...s, status: "maintenance" } : s));
    addToast({ 
      type: "info", 
      icon: "🔧", 
      title: "Maintenance Check", 
      msg: `Desk ${id} marked for maintenance.` 
    });
    setSelectedDesk(null);
  };

  return (
    <div className="section" style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Welcome banner */}
      <div className="card" style={{ marginBottom: 30, background: `linear-gradient(135deg, rgba(205, 160, 82, 0.04), rgba(110, 130, 148, 0.04))`, border: `1px solid rgba(205, 160, 82, 0.12)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Admin Management Console ⚙️</div>
            <div style={{ fontSize: 13, color: C.muted, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
              <span>📊 Total Workspaces: <strong>{seats.length}</strong></span>
              <span className="dot-divider" />
              <span>🟢 {free} available</span>
              <span className="dot-divider" />
              <span>🔴 {occ} occupied</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="badge badge-purple" style={{ height: "fit-content", alignSelf: "center" }}>
              <span className="live-dot cyan" style={{ marginRight: 6 }} />
              Live Monitor
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => {
              setSeats(prev => prev.map(s => s.status === "abandoned" ? { ...s, status: "free", student: null, checkIn: null, awayStart: null } : s));
              addToast({ 
                type: "success", 
                icon: "🔓", 
                title: "System Restored", 
                msg: "All abandoned workspaces successfully released." 
              });
            }}>Clear Abandoned ({abandoned})</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "defects", label: "🔧 Maintenance" },
          { id: "violations", label: "⚠️ Policy warnings" },
          { id: "logs", label: "📋 System Logs" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`dashboard-tab ${tab === t.id ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-view-container" key={tab}>
        {tab === "overview" && (
          <div>
            <div className="stat-grid">
              <div className="stat-card primary">
                <div className="stat-val">{seats.length}</div>
                <div className="stat-label">Total Desks</div>
              </div>
              <div className="stat-card success">
                <div className="stat-val">{occ}</div>
                <div className="stat-label">Active Sessions</div>
                <div className="stat-delta">{Math.round(occ / seats.length * 100)}% utilization</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-val">{away}</div>
                <div className="stat-label">Away Breaks</div>
                <div className="stat-delta">Active break timers</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-val">{violations}</div>
                <div className="stat-label">Policy Violations</div>
                <div className="stat-delta">{seats.filter(s => s.violations > 0).length} flagged students</div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>🗺️ Interactive Seating Layout</h3>
                <p>Monitor seating statuses. Click any active desk to manually reset or mark it for maintenance.</p>
              </div>
              <LibraryMap 
                seats={seats} 
                onSeatClick={(s) => {
                  if (s.status !== "free" && s.status !== "maintenance") {
                    setSelectedDesk(s);
                  } else {
                    addToast({ type: "info", icon: "ℹ️", msg: `Desk ${s.id} is currently ${s.status}.` });
                  }
                }} 
              />
            </div>

            <div className="panel-card" style={{ marginTop: 24 }}>
              <div className="panel-header">
                <h3>📈 Utilization Analytics</h3>
                <p>Peak utilization hours and weekly heatmap distribution.</p>
              </div>
              <div className="analytics-layout-combined">
                <div className="analytics-column">
                  <h4 style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>Peak Hours Distribution</h4>
                  <div style={{ display: "flex", alignItems: "end", gap: 4, height: 120, paddingBottom: 10 }}>
                    {PEAK_DATA.map((d) => {
                      const isPeak = d.pct > 80;
                      return (
                        <div key={d.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div
                            className="chart-bar"
                            title={`${d.hour}: ${d.pct}%`}
                            style={{
                              width: "100%",
                              height: `${d.pct * 0.9}px`,
                              background: isPeak ? "var(--danger)" : "var(--primary)",
                              minHeight: 2,
                              borderRadius: "2px 2px 0 0"
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginTop: 8 }}>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>11 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "defects" && (
          <div className="panel-card">
            <h3>🚨 Workspace Defect Submissions</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Direct student maintenance tickets</p>
            <div className="admin-reports-list">
              {[
                { desk: "D-03", type: "Faulty Charger", student: "Anonymous", time: "14m ago", severity: "medium" },
                { desk: "B-05", type: "Noise Disturbance", student: "Anonymous", time: "31m ago", severity: "low" },
                { desk: "A-06", type: "Desk damage", student: "Karan T.", time: "2h ago", severity: "high" },
                { desk: "C-01", type: "Power Socket issues", student: "Anonymous", time: "3h ago", severity: "medium" },
              ].map((r, i) => (
                <div key={i} className="admin-report-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: C.text }}>Desk {r.desk}</span>
                      <span className={`badge badge-${r.severity === "high" ? "red" : r.severity === "medium" ? "amber" : "cyan"}`} style={{ fontSize: 8 }}>{r.type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>By {r.student} · {r.time}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => markMaintenance(r.desk)}>🔧 Service</button>
                    <button className="btn btn-sm btn-primary" onClick={() => addToast({ type: "success", icon: "✅", title: "Defect Resolved", msg: `Ticket for desk ${r.desk} closed.` })}>Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "violations" && (
          <div className="panel-card">
            <h3>⚠️ Policy Warning Console</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Flagged for recurrent seat hoarding</p>
            <div className="admin-violations-list">
              {seats.filter(s => s.violations > 0 && s.student).sort((a, b) => b.violations - a.violations).slice(0, 4).map(s => (
                <div key={s.id} className="admin-violation-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.student}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Last seat: {s.id} · {s.violations} flags</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm btn-amber" onClick={() => addToast({ type: "warn", icon: "⚠️", title: "Warning Sent", msg: `Warning notice sent to ${s.student}.` })}>Warn</button>
                    <button className="btn btn-sm btn-danger" onClick={() => addToast({ type: "info", icon: "🔒", title: "Access Blocked", msg: `${s.student} temporary block applied.` })}>Block</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="panel-card">
            <h3>📋 System Activity Logs</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Synced monitoring logs feed</p>
            <div className="mini-activity-feed" style={{ maxHeight: 400, overflowY: "auto" }}>
              {notifications && notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="mini-activity-item" style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div className={`activity-icon-bullet ${n.type}`} style={{ width: 8, height: 8, borderRadius: "50%", background: n.type === "success" ? C.green : n.type === "warn" ? C.amber : n.type === "error" ? C.red : C.cyan, marginTop: 4, flexShrink: 0 }} />
                    <div className="activity-item-details" style={{ flex: 1 }}>
                      <span className="activity-body" style={{ fontSize: 13, color: C.text }}>
                        {n.title && <strong className={`activity-title-tag ${n.type}`} style={{ color: n.type === "success" ? C.green : n.type === "warn" ? C.amber : n.type === "error" ? C.red : C.cyan }}>{n.title}: </strong>}
                        {n.body}
                      </span>
                      <div className="activity-time" style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 20 }}>No logs recorded.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedDesk && (
        <Modal title={`Manage Workspace: ${selectedDesk.id}`} onClose={() => setSelectedDesk(null)}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: C.surface, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Occupant Details</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedDesk.student || "Reserved Student"} ({selectedDesk.studentId || "N/A"})</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Status: <span className={`badge badge-${selectedDesk.status === "away" ? "amber" : "green"}`}>{selectedDesk.status}</span></div>
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              Choose a control action for this workspace. Releasing the desk will return it to available state. Marking service will flag it for maintenance.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => markMaintenance(selectedDesk.id)}>🔧 Flag Service</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => resetDesk(selectedDesk.id)}>🔓 Force Reset</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [userType, setUserType] = useState(null);
  const [seats, setSeats] = useState(INITIAL_SEATS);
  const [toasts, setToasts] = useState([]);
  const [userName, setUserName] = useState("Sriyash");
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [notifications, setNotifications] = useState([
    { id: 1, type: "info", icon: "📍", title: "Welcome back!", body: "Find your seat on the map below.", time: "Just now" },
    { id: 2, type: "warn", icon: "⚠️", title: "Peak hours approaching", body: "Library is 78% full. Grab a seat now.", time: "2 min ago" },
    { id: 3, type: "success", icon: "✅", title: "Seat released successfully", body: "Desk B-04 was released by Aryan K.", time: "12 min ago" }
  ]);

  const [leaderboard] = useState(LEADERBOARD);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const addToast = useCallback(({ type = "info", msg, icon = "", title }) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
    
    // Automatically sync toast alerts to persistent notifications log
    setNotifications(prev => [
      {
        id: Date.now() + Math.random(),
        type,
        icon,
        title: title || (type === "success" ? "Success Alert" : type === "warn" ? "System Warning" : type === "error" ? "Policy Action" : "Activity Log"),
        body: msg,
        time: "Just now"
      },
      ...prev
    ]);
  }, []);

  const user = useMemo(() => ({
    name: userName,
    id: userType === "admin" ? "ADM-2026-001" : "STU-2026-0413",
    role: userType
  }), [userType, userName]);

  const handleLogin = (type, name) => {
    setUserType(type);
    if (name && name.trim()) {
      setUserName(name.trim());
    } else {
      setUserName(type === "admin" ? "Admin Scholar" : "Student Scholar");
    }
    setPage(type === "admin" ? "admin" : "student");
    addToast({ type: "success", icon: "👋", msg: `Welcome, ${name && name.trim() ? name.trim() : (type === "admin" ? "Admin" : "Student")}! Authentication successful.` });
  };

  return (
    <div className="app">
      {/* Parallax Background Layers */}
      <div className="parallax-bg">
        <div className="parallax-grid" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
        <div className="parallax-blob blob-gold-1" style={{ transform: `translate3d(${mousePos.x * 50}px, ${scrollY * 0.2 + mousePos.y * 50}px, 0)` }} />
        <div className="parallax-blob blob-gold-2" style={{ transform: `translate3d(${mousePos.x * -70}px, ${scrollY * -0.12 + mousePos.y * -70}px, 0)` }} />
        <div className="parallax-blob blob-steel" style={{ transform: `translate3d(${mousePos.x * 30}px, ${scrollY * 0.05 + mousePos.y * 30}px, 0)` }} />
      </div>

      {/* Navbar (shown when logged in) */}
      {page !== "landing" && page !== "login" && (
        <nav className="nav">
          <div className="nav-logo" onClick={() => setPage("landing")} style={{ cursor: "pointer" }}>
            <div className="logo-icon-box"><i className="ti ti-shield-check"></i></div>
            DeskGuard
          </div>
          <div className="nav-tabs">
            {page === "student" && <span className="nav-tab-label student">Student Portal</span>}
            {page === "admin" && <span className="nav-tab-label admin">Admin Console</span>}
          </div>
          <div className="nav-right">
            <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <span className="live-dot cyan" />
              Connected
            </div>
            
            {/* User Avatar with Dropdown Sign Out */}
            <div className="avatar-container">
              <div className="avatar" onClick={() => setAvatarDropdownOpen(prev => !prev)}>
                {user.name[0]?.toUpperCase() || "S"}
              </div>
              {avatarDropdownOpen && (
                <>
                  <div className="avatar-dropdown-backdrop" onClick={() => setAvatarDropdownOpen(false)} />
                  <div className="avatar-dropdown">
                    <div style={{ padding: "4px 8px" }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.text, wordBreak: "break-all" }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: "var(--font-mono)" }}>{user.id}</div>
                      <div style={{ fontSize: 11, color: user.role === "admin" ? C.amber : C.cyan, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>
                        {user.role} workspace
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => { setAvatarDropdownOpen(false); addToast({ type: "info", msg: "Profile settings are synced from your University account." }); }}>
                      👤 View Profile
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={() => { setAvatarDropdownOpen(false); setPage("landing"); setUserType(null); }}>
                      🚪 Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </nav>
      )}

      {/* Pages */}
      {page === "landing" && (
        <LandingPage
          seats={seats}
          onLogin={(type) => {
            setUserType(type);
            setPage("login");
          }}
        />
      )}
      {page === "login" && <LoginPage onLogin={handleLogin} addToast={addToast} />}
      {page === "student" && (
        <StudentDashboard 
          seats={seats} 
          setSeats={setSeats} 
          addToast={addToast} 
          user={user} 
          notifications={notifications} 
          leaderboard={leaderboard} 
        />
      )}
      {page === "admin" && (
        <AdminDashboard 
          seats={seats} 
          setSeats={setSeats} 
          addToast={addToast} 
          notifications={notifications} 
        />
      )}

      {/* Landing page nav */}
      {page === "landing" && (
        <nav className="nav" style={{ position: "fixed", top: 0, left: 0, right: 0 }}>
          <div className="nav-logo" onClick={() => setPage("landing")} style={{ cursor: "pointer" }}>
            <div className="logo-icon-box"><i className="ti ti-shield-check"></i></div>
            DeskGuard
          </div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li>
              <button className="nav-cta" onClick={() => { setUserType("student"); setPage("login"); }}>
                Access Portal
              </button>
            </li>
          </ul>
        </nav>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
