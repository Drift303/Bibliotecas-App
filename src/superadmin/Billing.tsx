<<<<<<< HEAD
export default function Billing() {
=======
import LogoutButton from "../components/LogoutButton";

export default function Billing() {
  const userName = localStorage.getItem("userName") || "Administrador";

>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
  const invoices = [
    {
      id: 1,
      school: "Instituto Central",
      amount: "$1,500",
      status: "Pagado",
    },
    {
      id: 2,
      school: "Colegio Norte",
      amount: "$2,000",
      status: "Pendiente",
    },
  ];

  return (
    <div className="p-6">
<<<<<<< HEAD

      <h1 className="text-3xl font-bold mb-6">
        Facturación
      </h1>

      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full">

=======
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Facturacion
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sesion iniciada como {userName}
          </p>
        </div>

        <LogoutButton />
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3">
                Escuela
              </th>

              <th className="p-3">
                Monto
              </th>

              <th className="p-3">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b"
              >
                <td className="p-3">
                  {invoice.school}
                </td>

                <td className="p-3">
                  {invoice.amount}
                </td>

                <td className="p-3">
                  {invoice.status}
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
