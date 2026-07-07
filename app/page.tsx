import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { BackgroundRemoverTool } from "@/components/background-remover-tool";

const useCases = [
  "Product photos",
  "Portrait cutouts",
  "Logo cleanup",
  "Social media images",
];

const faqs = [
  {
    question: "Is this image background remover free?",
    answer:
      "The MVP can process images through the configured Remove.bg API key. Usage limits can be adjusted in Cloudflare to control API cost.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "You can sign in with Google so the app can keep login sessions in D1. The upload and download flow can still stay lightweight.",
  },
  {
    question: "Are my images stored?",
    answer:
      "No. Images pass through browser memory and the API request only, then the processed image is returned directly to the browser.",
  },
  {
    question: "What file formats are supported?",
    answer: "The upload flow supports JPG, PNG, and WebP images up to 10 MB.",
  },
  {
    question: "Can I download a transparent PNG?",
    answer:
      "Yes. The default result is a transparent PNG, with optional white or custom solid-color exports.",
  },
  {
    question: "Can I make the background white?",
    answer: "Yes. White and custom solid backgrounds are composed in the browser.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="border-b border-line/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="text-base font-semibold text-ink" href="/">
            Image Background Remover
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link className="transition hover:text-ink" href="/pricing">
              Pricing
            </Link>
            <a className="transition hover:text-ink" href="#faq">
              FAQ
            </a>
            <a className="transition hover:text-ink" href="#privacy">
              Privacy
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl content-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-coral">
            Online AI tool
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Image Background Remover
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Remove backgrounds from product photos, portraits, and graphics in
            seconds. Download a transparent PNG or add a clean white background.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {useCases.map((item) => (
              <span
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-slate-700"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <BackgroundRemoverTool />
      </section>

      <section className="border-y border-line bg-white" id="privacy">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-lg font-semibold text-ink">No storage</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your images are processed instantly and are not stored by us.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Browser exports</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              White and custom backgrounds are created locally with Canvas.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Cloudflare ready</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The API route is built to forward image bytes without app storage.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8" id="faq">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-ink">FAQ</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <article
              className="rounded-lg border border-line bg-white p-5"
              key={item.question}
            >
              <h3 className="text-base font-semibold text-ink">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Image Background Remover</span>
          <span>JPG, PNG, and WebP up to 10 MB.</span>
        </div>
      </footer>
    </main>
  );
}
