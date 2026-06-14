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
    <div className="bg-white rounded-lg shadow p-4">

      <div className="h-40 bg-slate-200 rounded mb-4"></div>

      <h2 className="font-bold">
        {book.title}
      </h2>

      <p className="text-gray-500">
        {book.author}
      </p>

      <span className="inline-block mt-2 px-2 py-1 rounded bg-green-100 text-green-700">
        {book.status}
      </span>

    </div>
  );
}