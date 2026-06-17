interface BookProps {
  book: {
    id: number;
    title: string;
    author: string;
    status: string;
  };
}

export default function BookCard({
  book,
}: BookProps) {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-[#E5E7EB]
        p-4
        transition-all
        duration-300
        hover:shadow-xl
        hover:-translate-y-2
        hover:border-[#3B82F6]
      "
    >

      {/* Espacio reservado para futuras portadas */}
      <div
        className="
          h-48
          rounded-xl
          mb-4
          bg-gradient-to-br
          from-[#1E3A5F]
          via-[#2A4D74]
          to-[#3B82F6]
          flex
          flex-col
          items-center
          justify-center
          text-white
        "
      >
        <div className="text-5xl mb-2">
          📖
        </div>

        <p className="text-xs uppercase tracking-widest opacity-80">
          Biblioteca Digital
        </p>
      </div>

      <h2
        className="
          font-bold
          text-lg
          text-[#1E3A5F]
          mb-1
          line-clamp-2
        "
      >
        {book.title}
      </h2>

      <p className="text-gray-500 mb-3">
        {book.author}
      </p>

      <span
        className={`
          inline-block
          px-3
          py-1
          rounded-full
          text-sm
          font-medium
          ${
            book.status === "Disponible"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }
        `}
      >
        {book.status}
      </span>

    </div>
  );
}