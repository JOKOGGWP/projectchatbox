declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (input: string, options?: Record<string, unknown>) => string;
  };
  export default DOMPurify;
}

declare module 'marked' {
  export function marked(src: string, options?: { async?: boolean }): string | Promise<string>;
  export function parse(src: string, options?: { async?: boolean }): string | Promise<string>;
}

declare module 'highlight.js' {
  const hljs: {
    highlight: (code: string, options: { language: string }) => { value: string };
    highlightAuto: (code: string) => { value: string };
    getLanguage: (name: string) => unknown;
    highlightAll: () => void;
  };
  export default hljs;
}
