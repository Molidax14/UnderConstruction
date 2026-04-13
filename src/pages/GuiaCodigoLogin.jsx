import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const markdownStyles = {
  article:
    "max-w-3xl text-white/90 leading-relaxed print:text-black lg:pl-2",
  h1: "text-2xl font-bold text-white mb-6 print:text-black",
  h2: "text-xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/20 print:text-black print:border-gray-300 scroll-mt-24",
  h3: "text-lg font-bold text-white mt-6 mb-3 print:text-black scroll-mt-24",
  p: "mb-4",
  strong: "text-white font-semibold print:text-black",
  code: "bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono print:bg-gray-100 print:text-gray-800",
  pre: "bg-white/5 border border-white/20 rounded-xl p-4 overflow-x-auto mb-4 text-sm print:bg-gray-50 print:border-gray-300 print:text-gray-800",
  table: "w-full mb-4 border-collapse",
  th: "border border-white/20 px-3 py-2 text-left font-semibold print:border-gray-300",
  td: "border border-white/20 px-3 py-2 print:border-gray-300",
  blockquote:
    "border-l-4 border-white/30 pl-4 my-4 text-white/80 print:border-gray-400 print:text-gray-700",
  hr: "border-white/20 my-8 print:border-gray-300",
};

const SPRING_NAV = [
  { href: "#spring-boot-modulo-backend-spring", label: "Módulo backend-spring" },
  { href: "#authcontroller-login-y-registro-rest", label: "AuthController" },
  { href: "#authservice-bcrypt-y-mariadb", label: "AuthService" },
  { href: "#securityconfig-cors-y-filtro-jwt", label: "SecurityConfig" },
  { href: "#jwtauthenticationfilter", label: "JwtAuthenticationFilter" },
  { href: "#jwtservice-tokens-jwt", label: "JwtService" },
];

const SPRING_FILES = [
  "web/AuthController.java",
  "service/AuthService.java",
  "config/SecurityConfig.java",
  "security/JwtAuthenticationFilter.java",
  "security/JwtService.java",
  "config/JwtConfig.java",
  "config/JwtProperties.java",
  "web/dto/LoginRequest.java",
  "web/dto/RegisterRequest.java",
];

function textFromReactNode(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromReactNode).join("");
  if (typeof node === "object" && node.props?.children != null) {
    return textFromReactNode(node.props.children);
  }
  return "";
}

function slugifyHeading(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Heading({ level, className, children }) {
  const Tag = level === 2 ? "h2" : "h3";
  const id = slugifyHeading(textFromReactNode(children));
  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  );
}

export default function GuiaCodigoLogin() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/guia-codigo-login.md")
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
    a.download = "guia-codigo-login.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const mdComponents = useMemo(
    () => ({
      h1: ({ children }) => <h1 className={markdownStyles.h1}>{children}</h1>,
      h2: ({ children }) => (
        <Heading level={2} className={markdownStyles.h2}>
          {children}
        </Heading>
      ),
      h3: ({ children }) => (
        <Heading level={3} className={markdownStyles.h3}>
          {children}
        </Heading>
      ),
      p: ({ children }) => <p className={markdownStyles.p}>{children}</p>,
      strong: ({ children }) => (
        <strong className={markdownStyles.strong}>{children}</strong>
      ),
      code: ({ className, children, ...props }) => (
        <code
          className={
            className?.includes("language-") ? "font-mono text-sm" : markdownStyles.code
          }
          {...props}
        >
          {children}
        </code>
      ),
      pre: ({ children }) => <pre className={markdownStyles.pre}>{children}</pre>,
      table: ({ children }) => <table className={markdownStyles.table}>{children}</table>,
      th: ({ children }) => <th className={markdownStyles.th}>{children}</th>,
      td: ({ children }) => <td className={markdownStyles.td}>{children}</td>,
      blockquote: ({ children }) => (
        <blockquote className={markdownStyles.blockquote}>{children}</blockquote>
      ),
      hr: () => <hr className={markdownStyles.hr} />,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-black text-white print:bg-white print:text-black">
      <header className="sticky top-0 z-20 border-b border-white/20 bg-black/95 backdrop-blur print:static">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/"
            className="text-white/70 hover:text-white text-sm transition-colors print:hidden order-1"
          >
            ← Volver
          </Link>
          <h1 className="text-lg font-semibold order-2 flex-1 text-center lg:text-left lg:pl-4">
            Guía: login — Spring Boot + React
          </h1>
          <div className="flex gap-2 print:hidden order-3">
            <button
              type="button"
              onClick={handleExportMd}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              Exportar .md
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row print:block">
        <aside className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/15 bg-zinc-950/80 lg:min-h-[calc(100vh-4.5rem)] lg:sticky lg:top-[4.5rem] lg:self-start lg:max-h-[calc(100vh-4.5rem)] overflow-y-auto print:hidden">
          <div className="p-4 lg:p-5 space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90 mb-1">
                Spring Boot
              </p>
              <p className="text-sm text-white/90 font-medium leading-snug">
                Backend Java — autenticación JWT y API REST
              </p>
              <p className="text-xs text-white/50 mt-2 font-mono leading-relaxed">
                com.underconstruction.api
              </p>
            </div>

            <nav aria-label="Secciones Spring Boot">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                En el código
              </p>
              <ul className="space-y-1">
                {SPRING_NAV.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="block text-sm text-emerald-300/90 hover:text-emerald-200 py-1.5 px-2 -mx-2 rounded-md hover:bg-white/5 transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                Archivos en backend-spring
              </p>
              <ul className="text-[11px] font-mono text-white/55 space-y-1 leading-relaxed">
                {SPRING_FILES.map((f) => (
                  <li key={f} className="break-all">
                    backend-spring/src/main/java/com/underconstruction/api/{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 py-8 pb-16 lg:pr-8">
          {loading ? (
            <p className="text-white/60">Cargando...</p>
          ) : (
            <article className={markdownStyles.article}>
              <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
