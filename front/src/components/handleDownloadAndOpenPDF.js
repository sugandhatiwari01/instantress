// src/components/handleDownloadAndOpenPDF.js
import html2pdf from "html2pdf.js";

export const handleDownloadAndOpenPDF = async (htmlString, fileName = "resume.pdf") => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = "210mm"; // A4 width
  iframe.style.height = "297mm"; // A4 height
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(htmlString);
  doc.close();

  // Wait for full load (fonts, CSS, layout)
  await new Promise((resolve) => {
    const checkReady = () => {
      const body = doc.body;
      if (body && body.offsetHeight > 100 && doc.readyState === "complete") {
        setTimeout(resolve, 500); // Buffer for rendering
      } else {
        setTimeout(checkReady, 100);
      }
    };
    iframe.onload = checkReady;
    checkReady();
  });

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    const pdfInstance = html2pdf().set(opt).from(iframe.contentDocument.body);
    await pdfInstance.save(); // Auto-download
    const blob = await pdfInstance.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank"); // Open in new tab
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(iframe);
  }
};