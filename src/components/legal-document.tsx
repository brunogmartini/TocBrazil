import Markdown from "react-markdown";
import { legalSectionId } from "@/lib/legal";

export function LegalDocument({ text }: { text: string }) {
  return (
    <article className="mt-8 max-w-3xl break-words text-foreground">
      <Markdown components={{
        h1: ({ children }) => <h1 className="heading-page mt-8 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 id={legalSectionId(String(children))} className="heading-subsection mt-10 mb-4 scroll-mt-24">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-7 mb-3 text-lg font-semibold">{children}</h3>,
        p: ({ children }) => <p className="my-4 leading-relaxed text-foreground">{children}</p>,
        ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 leading-relaxed">{children}</ul>,
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => <blockquote className="my-7 border-l-4 border-primary bg-surface px-5 py-2 leading-relaxed">{children}</blockquote>,
        a: ({ children, href }) => <a className="text-primary underline underline-offset-4" href={href}>{children}</a>,
      }}>{text}</Markdown>
    </article>
  );
}
