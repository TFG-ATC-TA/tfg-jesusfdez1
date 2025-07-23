"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function DemoPage() {
  const DESKTOP_SIZE = { width: 1200, height: 800 };
  const MOBILE_SIZE = { width: 375, height: 800 };

  const getAppOrigin = () => {
    if (typeof window === "undefined") return "";
    // Quita /demo si está en la ruta
    return window.location.origin;
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const [path, setPath] = useState("/");
  const desktopRef = useRef<HTMLIFrameElement>(null);
  const mobileRef = useRef<HTMLIFrameElement>(null);

  // Lee el path de la query
  useEffect(() => {
    const p = searchParams.get("path") || "/";
    setPath(p.startsWith("/") ? p : "/" + p);
  }, [searchParams]);

  // Sincronización de navegación entre iframes
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Solo aceptar mensajes de nuestros iframes
      if (event.origin !== getAppOrigin()) return;
      if (!event.data || !event.data.type) return;
      if (event.data.type === "navigate") {
        // Cambia la URL de ambos iframes si es diferente
        const newPath = event.data.path;
        if (desktopRef.current && desktopRef.current.contentWindow?.location.pathname !== newPath) {
          desktopRef.current.contentWindow!.location.href = getAppOrigin() + newPath;
        }
        if (mobileRef.current && mobileRef.current.contentWindow?.location.pathname !== newPath) {
          mobileRef.current.contentWindow!.location.href = getAppOrigin() + newPath;
        }
        // Actualiza la query de la demo
        if (newPath !== path) {
          router.replace(`/demo?path=${encodeURIComponent(newPath)}`);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [path, router]);

  // Inyecta script en los iframes para enviar navegación al padre
  const injectScript = `
    (function() {
      if (window.__DEMO_SYNCED__) return;
      window.__DEMO_SYNCED__ = true;
      window.addEventListener('popstate', function() {
        window.parent.postMessage({ type: 'navigate', path: window.location.pathname + window.location.search }, '*');
      });
      // Para pushState
      const origPush = window.history.pushState;
      window.history.pushState = function() {
        origPush.apply(this, arguments);
        window.parent.postMessage({ type: 'navigate', path: window.location.pathname + window.location.search }, '*');
      };
    })();
  `;

  // Cuando el iframe carga, inyecta el script
  function handleLoad(ref: React.RefObject<HTMLIFrameElement>, isMobile = false) {
    try {
      if (isMobile) {
        (ref.current?.contentWindow as any)?.eval(`
          (function() {
            document.documentElement.style.height = "100%";
            document.documentElement.style.overflow = "hidden";
            document.body.style.height = "100vh";
            document.body.style.overflow = "hidden";
            document.body.style.transform = "scale(0.9)";
            document.body.style.transformOrigin = "top left";
            document.body.style.width = "111.12%";
            document.body.style.height = "111.12%";
          })();
        `);
      }
      (ref.current?.contentWindow as any)?.eval(injectScript);
    } catch (e) {
      // Puede fallar por CORS si no es el mismo origen
    }
  }

  const appUrl = getAppOrigin() + path;

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 32, justifyContent: "center", alignItems: "flex-start", padding: 32 }}>
      <div>
        <div style={{ textAlign: "center", marginBottom: 8 }}>Escritorio</div>
        <iframe
          ref={desktopRef}
          src={appUrl}
          width={DESKTOP_SIZE.width}
          height={DESKTOP_SIZE.height}
          style={{ border: "1px solid #ccc", borderRadius: 8 }}
          onLoad={() => handleLoad(desktopRef, false)}
        />
      </div>
      <div>
        <div style={{ textAlign: "center", marginBottom: 8 }}>Móvil</div>
        <div
          style={{
            width: MOBILE_SIZE.width,
            height: MOBILE_SIZE.height, // Altura igual al iframe
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <iframe
            ref={mobileRef}
            src={appUrl}
            width={MOBILE_SIZE.width}
            height={MOBILE_SIZE.height}
            style={{ border: "1px solid #ccc", borderRadius: 16, transformOrigin: "top left" }}
            onLoad={() => handleLoad(mobileRef, true)}
          />
        </div>
      </div>
    </div>
  );
}

export default function DemoPageWrapper() {
  return (
    <Suspense fallback={<div>Cargando demo...</div>}>
      <DemoPage />
    </Suspense>
  );
} 