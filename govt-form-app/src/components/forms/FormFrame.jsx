import { useEffect, useRef, useState } from "react";

export default function FormFrame({ htmlTemplate, apiData, formBaseCss }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    if (!htmlTemplate) return;

    // Build exactly the shape the HTML forms expect:
    // const FORM_DATA = { status, filled_form }
    // Strip out "documents" — the forms don't use it.
    const formData = {
      status: apiData?.status ?? "success",
      filled_form: apiData?.filled_form ?? {},
    };

    // Replace the FORM_DATA declaration. The HTML files have a large
    // nested object — we match from "const FORM_DATA = {" all the way
    // to the closing "};" by tracking brace depth.
    const dataJson = JSON.stringify(formData, null, 2);
    const injected = (() => {
      const marker = "const FORM_DATA";
      const start = htmlTemplate.indexOf(marker);
      if (start === -1) return htmlTemplate; // safety fallback

      // Find the opening brace
      const braceStart = htmlTemplate.indexOf("{", start);
      if (braceStart === -1) return htmlTemplate;

      // Walk forward tracking brace depth to find the matching closing brace
      let depth = 0;
      let end = -1;
      for (let i = braceStart; i < htmlTemplate.length; i++) {
        if (htmlTemplate[i] === "{") depth++;
        else if (htmlTemplate[i] === "}") {
          depth--;
          if (depth === 0) { end = i; break; }
        }
      }
      if (end === -1) return htmlTemplate;

      // end + 1 points at the char after "}", which should be ";"
      // skip the ";" too if present
      const afterClose = htmlTemplate[end + 1] === ";" ? end + 2 : end + 1;

      return (
        htmlTemplate.slice(0, start) +
        `const FORM_DATA = ${dataJson};` +
        htmlTemplate.slice(afterClose)
      );
    })();

    // Inline form-base.css
    const withInlineCss = injected.replace(
      /<link[^>]*href=["']form-base\.css["'][^>]*\/?>/i,
      `<style>${formBaseCss || ""}</style>`
    );

    // Auto-height script
    const withResizeScript = withInlineCss.replace(
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
      </script>
      </body>`
    );

    const blob = new Blob([withResizeScript], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    if (iframeRef.current) iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);

  }, [htmlTemplate, apiData, formBaseCss]);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "iframeHeight" && e.data.height) {
        setHeight(e.data.height + 40);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: "100%",
        height: `${height}px`,
        border: "none",
        display: "block",
        transition: "height 0.3s ease",
      }}
      title="Government Form"
      sandbox="allow-scripts allow-same-origin allow-modals"
    />
  );
}