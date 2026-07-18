interface BookProps {
  book: {
    id: string | number;
    title: string;
    author: string;
    status: string;
  };
  onClick?: () => void;
}

export default function BookCard({
  book,
  onClick,
}: BookProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="
      relative
      overflow-hidden
      bg-white/70 dark:bg-slate-900/70
      backdrop-blur-2xl
      rounded-3xl
      border
      border-white/50 dark:border-slate-800/50
      shadow-xl
      shadow-slate-200/40
      dark:shadow-black/40
      p-6
      transition-all
      duration-300
      ease-in-out
      hover:-translate-y-2
      hover:scale-[1.02]
      hover:shadow-2xl
      hover:border-blue-500
      dark:hover:border-blue-600
      cursor-pointer
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500/60
      group
      "
    >
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
      <h2 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white mb-2 line-clamp-2 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {book.title}
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">
        {book.author}
      </p>

      <span
        className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold backdrop-blur-md border transition-all duration-300 ${
          book.status === "Disponible"
            ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
            : "bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
        }`}
      >
        {book.status}
      </span>
    </div>
  );
}
