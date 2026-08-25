import { APP_NAME, SCAFFOLD_NOTICE, SCAFFOLD_PHASE } from "@/lib/constants";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm tracking-widest text-[var(--text-dim)]">
        {APP_NAME.toUpperCase()}_ / PHASE {SCAFFOLD_PHASE}
      </p>
      <h1 className="text-4xl font-semibold uppercase leading-none text-[var(--primary)] md:text-6xl">
        BlastRadius
      </h1>
      <p className="max-w-xl text-base leading-relaxed">{SCAFFOLD_NOTICE}</p>
      <p className="text-sm text-[var(--text-dim)]">
        Canonical product docs live in <code className="text-[var(--secondary)]">docs/</code>.
        Implementation starts at Phase 1 (domain schemas).
      </p>
    </main>
  );
}
