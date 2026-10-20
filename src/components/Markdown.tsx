import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function Markdown({
  children,
  className,
  openLinksInNewTab = false,
}: {
  children: string;
  className?: string;
  openLinksInNewTab?: boolean;
}) {
  return (
    <div className={`prose-oj${className ? ` ${className}` : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ href, children, title }) => {
            const isWebLink = !!href && !/^(?:#|mailto:|tel:)/i.test(href);
            const opensNewTab = isWebLink && (
              openLinksInNewTab || /^(?:https?:)?\/\//i.test(href)
            );
            return (
              <a
                href={href}
                title={title}
                target={opensNewTab ? "_blank" : undefined}
                rel={opensNewTab ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
