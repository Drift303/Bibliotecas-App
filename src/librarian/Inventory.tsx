import DashboardLayout from "../components/DashboardLayout";

export default function Inventory() {
  const books = [
    {
      id: 1,
      isbn: "978-0132350884",
      title: "Clean Code",
      author: "Robert Martin",
      status: "Disponible",
    },
    {
      id: 2,
      isbn: "978-1492056355",
      title: "Learning React",
      author: "Alex Banks",
      status: "Prestado",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Inventario de Libros
        </h1>

        <button className="bg-blue-700 text-white px-4 py-2 rounded">
          + Nuevo Libro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">ISBN</th>
              <th className="p-3 text-left">Título</th>
              <th className="p-3 text-left">Autor</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {books.map((book) => (
              <tr
                key={book.id}
                className="border-b"
              >
                <td className="p-3">{book.isbn}</td>
                <td className="p-3">{book.title}</td>
                <td className="p-3">{book.author}</td>
                <td className="p-3">
                  {book.status}
                </td>

                <td className="p-3 text-center space-x-2">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded">
                    Editar
                  </button>

                  <button className="bg-red-600 text-white px-3 py-1 rounded">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}