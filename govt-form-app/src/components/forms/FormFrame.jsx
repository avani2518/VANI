import { useEffect, useRef, useState } from "react";

export default function FormFrame({ htmlTemplate, apiData, formBaseCss, onEndSession }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(800);

  // Listen for messages from the iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "iframeHeight" && e.data.height) {
        setHeight(e.data.height + 40);
      }
      if (e.data?.type === "endSession") {
        onEndSession?.();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onEndSession]);

  useEffect(() => {
    if (!htmlTemplate) return;

    const formData = {
      status:      apiData?.status      ?? "success",
      filled_form: apiData?.filled_form ?? {},
    };

    const dataJson = JSON.stringify(formData, null, 2);

    // ── Step 1: inject FORM_DATA ──────────────────────────────────────────
    const injected = (() => {
      const marker = "const FORM_DATA";
      const start  = htmlTemplate.indexOf(marker);
      if (start === -1) return htmlTemplate;

      const braceStart = htmlTemplate.indexOf("{", start);
      if (braceStart === -1) return htmlTemplate;

      let depth = 0, end = -1;
      for (let i = braceStart; i < htmlTemplate.length; i++) {
        if (htmlTemplate[i] === "{") depth++;
        else if (htmlTemplate[i] === "}") {
          depth--;
          if (depth === 0) { end = i; break; }
        }
      }
      if (end === -1) return htmlTemplate;

      const afterClose = htmlTemplate[end + 1] === ";" ? end + 2 : end + 1;
      return (
        htmlTemplate.slice(0, start) +
        `const FORM_DATA = ${dataJson};` +
        htmlTemplate.slice(afterClose)
      );
    })();

    // ── Step 2: inline form-base.css ──────────────────────────────────────
    const withInlineCss = injected.replace(
      /<link[^>]*href=["']form-base\.css["'][^>]*\/?>/i,
      `<style>${formBaseCss || ""}</style>`
    );

    // ── Step 3: inject End Session button between Reset and Print ─────────
    // Targets the exact form-footer div seen in the HTML templates.
    // Inserts End Session between the two existing buttons.
    const endSessionBtn = `
      <button
        type="button"
        onclick="window.parent.postMessage({ type: 'endSession' }, '*')"
        style="
          background: linear-gradient(135deg, #2c5f94, #3f7bb6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        "
        onmouseover="this.style.transform='translateY(-1px)'"
        onmouseout="this.style.transform='translateY(0)'"
      >
        🚪 End Session
  </button>`;

    // Match exactly: the reset button closed tag, then capture what follows
    // so we can insert End Session right after it, before the Print button.
    // const withEndSession = withInlineCss.replace(
    //   /(<button[^>]*id="resetBtn"[^>]*>[\s\S]*?<\/button>)(\s*)(<button[^>]*onclick="window\.print\(\)")/,
    //   `$1$2${endSessionBtn}$2$3`
    // );
    const withEndSession = withInlineCss.replace(
      /(<button[^>]*id="resetBtn"[^>]*>[\s\S]*?<\/button>)(\s*)(<button[^>]*id="printBtn"[^>]*>)/,
      `$1$2${endSessionBtn}$2$3`
    );

    // ── Step 4: auto-height + postMessage script ──────────────────────────
    const withResizeScript = withEndSession.replace(
      "</body>",
      `<script>
        function notifyHeight() {
          const h = document.documentElement.scrollHeight;
          window.parent.postMessage({ type: 'iframeHeight', height: h }, '*');
        }
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(notifyHeight, 400);
          new MutationObserver(notifyHeight).observe(document.body, {
            childList: true, subtree: true, attributes: true
          });
        });
      <\/script>
      </body>`
    );

    const blob = new Blob([withResizeScript], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    if (iframeRef.current) iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);

  }, [htmlTemplate, apiData, formBaseCss]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width:      "100%",
        height:     `${height}px`,
        border:     "none",
        display:    "block",
        transition: "height 0.3s ease",
      }}
      title="Government Form"
      sandbox="allow-scripts allow-same-origin allow-modals"
    />
  );
}