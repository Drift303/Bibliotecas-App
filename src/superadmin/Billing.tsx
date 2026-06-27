import LogoutButton from "../components/LogoutButton";

export default function Billing() {
  const userName = localStorage.getItem("userName") || "Administrador";

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
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">
                Escuela
              </th>
              <th className="p-3 text-left">
                Monto
              </th>
              <th className="p-3 text-left">
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
        </table>
      </div>
    </div>
  );
}