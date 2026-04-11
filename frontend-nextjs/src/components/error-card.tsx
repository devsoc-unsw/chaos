export default function ErrorCard({
  title,
  message,
  details,
  imageSrc = "/chaos.png",
  imageAlt = "Error",
}: {
  title: string;
  message: string;
  details?: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <div className="min-h-screen font-sans flex flex-col items-center justify-center px-6">
      <div className="relative mb-8">
        <div className="absolute inset-0 blur-3xl opacity-30 bg-purple-500 rounded-full scale-100" />
        <img
          src={imageSrc}
          alt={imageAlt}
          width={500}
          height={500}
          className="relative z-10 drop-shadow-lg"
        />
      </div>
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-950 mb-4">
          {title}
        </h1>
        <p className="md:text-xl text-zinc-500 font-light max-w-xl text-xl text-slate-700 leading-relaxed">
          {message}
          {details && (
            <>
              <br />
              <span className="font-medium text-slate-900 mt-4 block">
                {details}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
