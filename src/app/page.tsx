export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-8">
      <main className="flex flex-col items-center gap-6 max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Plataforma SaaS <span className="text-blue-500">Telegram</span>
        </h1>
        <p className="text-lg text-zinc-400">
          Crie sua própria loja no Telegram em minutos. Produtos digitais, assinaturas e muito mais.
        </p>
        
        <div className="flex gap-4 mt-8">
          <a
            href="/dashboard"
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
          >
            Acessar Painel
          </a>
          <a
            href="/admin"
            className="rounded-full bg-zinc-800 text-white px-6 py-3 font-semibold hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            Admin Platform
          </a>
        </div>
      </main>
    </div>
  );
}
