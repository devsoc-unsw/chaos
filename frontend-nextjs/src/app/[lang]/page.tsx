export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,97%,97%)] to-white font-sans">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo + Title */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-purple-500 rounded-full scale-75" />
          <div className="relative flex items-center justify-center gap-6">
            <img
              src="/chaos.png"
              alt="Chaos Logo"
              width={80}
              height={80}
              className="drop-shadow-2xl"
            />
            <h1 className="text-7xl md:text-8xl font-light tracking-tight text-[#191d24]">
              Chaos
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-2xl md:text-3xl text-zinc-500 font-light max-w-xl mb-12">
          Recruitment drives, without the chaos.
        </p>
      </section>
    </div>
  );
}
