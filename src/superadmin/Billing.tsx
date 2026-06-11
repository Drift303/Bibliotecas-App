export default function Billing() {
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

      <h1 className="text-3xl font-bold mb-6">
        Facturación
      </h1>

      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full">

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

        </table>

      </div>

    </div>
  );
}