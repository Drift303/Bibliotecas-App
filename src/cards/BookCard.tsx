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
        bg-white/60 dark:bg-slate-900/60
        backdrop-blur-2xl
        rounded-3xl
        shadow-lg shadow-slate-200/50 dark:shadow-black/40
        border
        border-white/50 dark:border-slate-800/50
        p-6
        transition-all
        duration-300
        hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-black/60
        hover:-translate-y-2
        hover:border-blue-400 dark:hover:border-blue-700/50
        hover:bg-white/80 dark:hover:bg-slate-900/80
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500/60
      "
    >
      <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">
        {book.title}
      </h2>

      <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">
        {book.author}
      </p>

      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
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
