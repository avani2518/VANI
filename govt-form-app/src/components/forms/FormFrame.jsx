import { useEffect, useRef, useState } from "react";

export default function FormFrame({
  htmlTemplate,
  apiData,
  formBaseCss,
  onEndSession,
}) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(800);

  // ─────────────────────────────────────────────────────────────
  // Listen for messages from iframe
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "iframeHeight" && e.data.height) {
        setHeight(e.data.height);
      }

      if (e.data?.type === "endSession") {
        onEndSession?.();
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, [onEndSession]);

  // ─────────────────────────────────────────────────────────────
  // Build iframe HTML
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!htmlTemplate) return;

    const formData = {
      status: apiData?.status ?? "success",
      filled_form: apiData?.filled_form ?? {},
    };

    const dataJson = JSON.stringify(formData, null, 2);

    // ───────────────────────────────────────────────────────────
    // Step 1: Inject FORM_DATA
    // ───────────────────────────────────────────────────────────
    const injected = (() => {
      const marker = "const FORM_DATA";

      const start = htmlTemplate.indexOf(marker);

      if (start === -1) return htmlTemplate;

      const braceStart = htmlTemplate.indexOf("{", start);

      if (braceStart === -1) return htmlTemplate;

      let depth = 0;
      let end = -1;

      for (let i = braceStart; i < htmlTemplate.length; i++) {
        if (htmlTemplate[i] === "{") depth++;

        else if (htmlTemplate[i] === "}") {
          depth--;

          if (depth === 0) {
            end = i;
            break;
          }
        }
      }

      if (end === -1) return htmlTemplate;

      const afterClose =
        htmlTemplate[end + 1] === ";" ? end + 2 : end + 1;

      return (
        htmlTemplate.slice(0, start) +
        `const FORM_DATA = ${dataJson};` +
        htmlTemplate.slice(afterClose)
      );
    })();

    // ───────────────────────────────────────────────────────────
    // Step 2: Inline form-base.css
    // ───────────────────────────────────────────────────────────
    const withInlineCss = injected.replace(
      /<link[^>]*href=["']form-base\.css["'][^>]*\/?>/i,
      `
      <style>
        ${formBaseCss || ""}

        html,
        body {
          height: auto !important;
          min-height: auto !important;
          overflow-x: hidden;
        }

        .form-page-wrapper,
        .form-card,
        .form-body {
          height: auto !important;
          min-height: auto !important;
        }

        .form-page-wrapper {
          padding-bottom: 24px !important;
        }
      </style>
      `
    );

    // ───────────────────────────────────────────────────────────
    // Step 3: Insert End Session button
    // ───────────────────────────────────────────────────────────
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
        "
      >
        🚪 End Session
      </button>
    `;

    const withEndSession = withInlineCss.replace(
      /(<button[^>]*id="resetBtn"[^>]*>[\s\S]*?<\/button>)(\s*)(<button[^>]*id="printBtn"[^>]*>)/,
      `$1$2${endSessionBtn}$2$3`
    );

    // ───────────────────────────────────────────────────────────
    // Step 4: Accurate iframe auto-height
    // ───────────────────────────────────────────────────────────
    const withResizeScript = withEndSession.replace(
      "</body>",
      `
      <script>
        function getAccurateHeight() {
          return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
        }

        function notifyHeight() {
          const height = getAccurateHeight();

          window.parent.postMessage(
            {
              type: 'iframeHeight',
              height: height
            },
            '*'
          );
        }

        window.addEventListener('load', () => {
          notifyHeight();

          setTimeout(notifyHeight, 100);
          setTimeout(notifyHeight, 300);
          setTimeout(notifyHeight, 600);
          setTimeout(notifyHeight, 1000);
        });

        window.addEventListener('resize', notifyHeight);

        document.addEventListener('click', () => {
          setTimeout(notifyHeight, 100);
        });

        document.addEventListener('input', () => {
          setTimeout(notifyHeight, 100);
        });
      <\/script>
      </body>
      `
    );

    // ───────────────────────────────────────────────────────────
    // Create iframe blob
    // ───────────────────────────────────────────────────────────
    const blob = new Blob([withResizeScript], {
      type: "text/html",
    });

    const url = URL.createObjectURL(blob);

    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlTemplate, apiData, formBaseCss]);

  // ─────────────────────────────────────────────────────────────
  // Render iframe
  // ─────────────────────────────────────────────────────────────
  return (
    <iframe
      ref={iframeRef}
      title="Government Form"
      sandbox="allow-scripts allow-same-origin allow-modals"
      style={{
        width: "100%",
        height: `${height}px`,
        border: "none",
        display: "block",
        overflow: "hidden",
      }}
    />
  );
}