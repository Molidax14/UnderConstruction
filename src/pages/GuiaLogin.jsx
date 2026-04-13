import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const markdownStyles = {
  article: "max-w-3xl mx-auto text-white/90 leading-relaxed print:text-black",
  h1: "text-2xl font-bold text-white mb-6 print:text-black",
  h2: "text-xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/20 print:text-black print:border-gray-300",
  h3: "text-lg font-bold text-white mt-6 mb-3 print:text-black",
  p: "mb-4",
  strong: "text-white font-semibold print:text-black",
  code: "bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono print:bg-gray-100 print:text-gray-800",
  pre: "bg-white/5 border border-white/20 rounded-xl p-4 overflow-x-auto mb-4 text-sm print:bg-gray-50 print:border-gray-300 print:text-gray-800",
  table: "w-full mb-4 border-collapse",
  th: "border border-white/20 px-3 py-2 text-left font-semibold print:border-gray-300",
  td: "border border-white/20 px-3 py-2 print:border-gray-300",
  blockquote: "border-l-4 border-white/30 pl-4 my-4 text-white/80 print:border-gray-400 print:text-gray-700",
  hr: "border-white/20 my-8 print:border-gray-300",
};

export default function GuiaLogin() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/guia-login.md")
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guia-login.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-black text-white print:bg-white print:text-black">
      <header className="sticky top-0 z-10 border-b border-white/20 bg-black/95 backdrop-blur print:static">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/"
            className="text-white/70 hover:text-white text-sm transition-colors print:hidden order-1"
          >
            ← Volver
          </Link>
          <h1 className="text-lg font-semibold order-2 flex-1 text-center">Guía de Login</h1>
          <div className="flex gap-2 print:hidden order-3">
            <button
              onClick={handleExportMd}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              Exportar .md
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-16">
        {loading ? (
          <p className="text-white/60">Cargando...</p>
        ) : (
          <article className={markdownStyles.article}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className={markdownStyles.h1}>{children}</h1>,
                h2: ({ children }) => <h2 className={markdownStyles.h2}>{children}</h2>,
                h3: ({ children }) => <h3 className={markdownStyles.h3}>{children}</h3>,
                p: ({ children }) => <p className={markdownStyles.p}>{children}</p>,
                strong: ({ children }) => <strong className={markdownStyles.strong}>{children}</strong>,
                code: ({ className, children, ...props }) => (
                  <code
                    className={className?.includes("language-") ? "font-mono text-sm" : markdownStyles.code}
                    {...props}
                  >
                    {children}
                  </code>
                ),
                pre: ({ children }) => <pre className={markdownStyles.pre}>{children}</pre>,
                table: ({ children }) => <table className={markdownStyles.table}>{children}</table>,
                th: ({ children }) => <th className={markdownStyles.th}>{children}</th>,
                td: ({ children }) => <td className={markdownStyles.td}>{children}</td>,
                blockquote: ({ children }) => <blockquote className={markdownStyles.blockquote}>{children}</blockquote>,
                hr: () => <hr className={markdownStyles.hr} />,
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        )}
      </main>
    </div>
  );
}
