interface BookProps {
  book: {
    id: string | number;
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
        p-6
        transition-all
        duration-300
        hover:shadow-xl
        hover:-translate-y-2
        hover:border-[#3B82F6]
      "
    >

      <h2
        className="
          font-bold
          text-lg
          text-[#1E3A5F]
          mb-2
          line-clamp-2
        "
      >
        {book.title}
      </h2>

      <p className="text-gray-500 mb-4">
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