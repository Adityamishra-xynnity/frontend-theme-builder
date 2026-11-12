
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function designToHtml(
  canvasDataUrl: string,
  designName = "My Design",
): string {
  const safeName = escapeHtml(designName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      min-height: 100%;
    }

    body {
      padding: 20px;
      background: #f1f5f9;
    }

    .design-container {
      width: 900px;
      max-width: 100%;
      margin: 0 auto;
    }

    .design-image {
      display: block;
      width: 100%;
      height: auto;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .design-container {
        width: 900px;
        max-width: 100%;
      }
    }
  </style>
</head>

<body>
  <main class="design-container">
    <img
      class="design-image"
      src="${canvasDataUrl}"
      width="900"
      height="650"
      alt="${safeName}"
    />
  </main>
</body>
</html>`;
}
