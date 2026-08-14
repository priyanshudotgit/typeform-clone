"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "https://typeform-clone-backend-0o3e.onrender.com";

const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;
const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 120_000; // 2 min timeout

export default function ServerWakeupBanner() {
  const [status, setStatus] = useState<"idle" | "checking" | "awake" | "timeout">("idle");
  const [dots, setDots] = useState(".");
  const [elapsed, setElapsed] = useState(0);
  
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    // Only check if we are unauthenticated or loading. If authenticated, no need to prewarm.
    if (sessionStatus === "authenticated") return;

    let cancelled = false;
    let startTime = 0;
    let dotInterval: ReturnType<typeof setInterval> | null = null;

    function startVisible() {
      startTime = Date.now();
      dotInterval = setInterval(() => {
        if (cancelled) return;
        setDots((d) => (d.length >= 3 ? "." : d + "."));
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    }

    async function ping(isFirst: boolean) {
      if (cancelled) return;
      if (!isFirst && Date.now() - startTime > MAX_WAIT_MS) {
        setStatus("timeout");
        if (dotInterval) clearInterval(dotInterval);
        return;
      }

      let slowTimer: ReturnType<typeof setTimeout> | null = null;
      if (isFirst) {
        // If the server takes more than 1.5s to respond, assume it's sleeping
        slowTimer = setTimeout(() => {
          if (!cancelled) {
            setStatus("checking");
            startVisible();
          }
        }, 1500);
      }

      try {
        const res = await fetch(HEALTH_ENDPOINT, {
          method: "GET",
          cache: "no-store",
          // We removed the short 8s timeout here so that a slow waking Render 
          // instance won't falsely trigger a catch block.
        });
        
        if (slowTimer) clearTimeout(slowTimer);

        if (res.ok && !cancelled) {
          setStatus("awake");
          if (dotInterval) clearInterval(dotInterval);
          return;
        }
      } catch {
        if (slowTimer) clearTimeout(slowTimer);
      }
      
      if (!cancelled) {
        setTimeout(() => ping(false), POLL_INTERVAL_MS);
      }
    }

    ping(true);

    return () => {
      cancelled = true;
      if (dotInterval) clearInterval(dotInterval);
    };
  }, [sessionStatus]);

  // Only show the toast on the login page
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (status === "idle" || status === "awake" || !isAuthPage) return null;

  return (
    <div style={styles.toast} role="status" aria-live="polite">
      {/* Icon */}
      <div style={styles.iconWrap}>
        <div style={styles.pulse} />
        <div style={styles.iconInner}>
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="6" width="28" height="8" rx="3" fill="#191919" />
            <rect x="2" y="18" width="28" height="8" rx="3" fill="#6b6b6b" />
            <circle cx="26" cy="10" r="2" fill="#e5e5e5" />
            <circle cx="26" cy="22" r="2" fill="#e5e5e5" />
          </svg>
        </div>
      </div>

      <div style={styles.content}>
        {status === "checking" ? (
          <>
            <h3 style={styles.title}>Waking up server{dots}</h3>
            <p style={styles.subtitle}>
              Backend spins down when inactive. Ready in ~30s.
              <span style={styles.timer}> ({elapsed}s)</span>
            </p>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressBar,
                  animation: "wakeup-progress 60s linear forwards",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <h3 style={{ ...styles.title, color: "#ef4444" }}>Taking longer than usual</h3>
            <p style={styles.subtitle}>Server might be under load.</p>
            <button
              style={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes wakeup-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes wakeup-progress {
          0%   { width: 0%; }
          100% { width: 95%; }
        }
        @keyframes toast-slide-in {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    background: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
    padding: "1rem",
    width: "min(350px, calc(100vw - 40px))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "1rem",
    animation: "toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  },
  iconWrap: {
    position: "relative",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pulse: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "rgba(25,25,25,0.06)",
    animation: "wakeup-pulse 2s ease-out infinite",
  },
  iconInner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#f7f5f2",
    border: "1px solid #e5e5e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    overflow: "hidden",
  },
  title: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#191919",
    whiteSpace: "nowrap",
  },
  subtitle: {
    margin: "0.2rem 0 0",
    fontSize: "0.75rem",
    color: "#6b6b6b",
    lineHeight: 1.4,
  },
  timer: {
    color: "#9b9b9b",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    background: "#f0ebe3",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: "0.5rem",
  },
  progressBar: {
    height: "100%",
    background: "#191919",
    borderRadius: 999,
    width: 0,
  },
  retryBtn: {
    marginTop: "0.5rem",
    padding: "0.4rem 1rem",
    background: "#191919",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
};
