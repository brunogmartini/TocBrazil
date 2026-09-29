import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export default function ContractPdfViewer({ url, onReachedEnd }: { url: string; onReachedEnd: () => void }) {
  const [pages, setPages] = useState(0);
  return (
    <div className="h-[34rem] overflow-y-auto border border-border bg-muted p-2 sm:p-4" onScroll={(event) => {
      const target = event.currentTarget;
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 32) onReachedEnd();
    }}>
      <Document file={url} loading={<p className="p-6 text-sm text-muted-foreground">Abrindo contrato…</p>} onLoadSuccess={({ numPages }) => setPages(numPages)}>
        {Array.from({ length: pages }, (_, index) => <Page key={index + 1} pageNumber={index + 1} width={Math.min(760, typeof window === "undefined" ? 760 : window.innerWidth - 72)} />)}
      </Document>
    </div>
  );
}