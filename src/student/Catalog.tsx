import BookCard from "../cards/BookCard";

export default function Catalog() {

  const books = [
    {
      id: 1,
      title: "Clean Code",
      author: "Robert C. Martin",
      status: "Disponible"
    },
    {
      id: 2,
      title: "React Básico",
      author: "Juan Pérez",
      status: "Prestado"
    }
  ];

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Catálogo de Libros
      </h1>

      <input
        type="text"
        placeholder="Buscar libro..."
        className="w-full border rounded p-2 mb-6"
      />

      <div className="grid md:grid-cols-3 gap-4">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
          />
        ))}
      </div>

    </div>
  );
}