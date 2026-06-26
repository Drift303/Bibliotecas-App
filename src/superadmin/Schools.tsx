<<<<<<< HEAD
export default function Schools() {
=======
import LogoutButton from "../components/LogoutButton";

export default function Schools() {
  const userName = localStorage.getItem("userName") || "Administrador";

>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
  const schools = [
    {
      id: 1,
      name: "Instituto Central",
      status: "Activa",
    },
    {
      id: 2,
      name: "Colegio Norte",
      status: "Suspendida",
    },
  ];

  return (
    <div className="p-6">
<<<<<<< HEAD

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Gestión de Escuelas
        </h1>

        <button className="bg-blue-700 text-white px-4 py-2 rounded">
          + Nueva Escuela
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full">

=======
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Gestion de Escuelas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sesion iniciada como {userName}
          </p>
        </div>

        <div className="flex gap-3">
          <button className="bg-blue-700 text-white px-4 py-2 rounded-xl">
            + Nueva Escuela
          </button>
          <LogoutButton />
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">
                Escuela
              </th>

              <th className="p-3 text-left">
                Estado
              </th>

              <th className="p-3 text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {schools.map((school) => (
              <tr
                key={school.id}
                className="border-b"
              >
                <td className="p-3">
                  {school.name}
                </td>

                <td className="p-3">
                  {school.status}
                </td>

                <td className="p-3 text-center">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
<<<<<<< HEAD

        </table>

      </div>
    </div>
  );
}
=======
        </table>
      </div>
    </div>
  );
}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
