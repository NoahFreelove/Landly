"use client";

interface TotalDebtCardProps {
  totalDebt: number;
  breakdown: {
    rent: number;
    late_fees: number;
    klarna: number;
    interest: number;
  };
  onMakePayment: () => void;
}

function getAmountColor(debt: number): string {
  if (debt > 1500) return "text-red-600";
  if (debt >= 500) return "text-yellow-600";
  return "text-green-600";
}

export default function TotalDebtCard({
  totalDebt,
  breakdown,
  onMakePayment,
}: TotalDebtCardProps) {
  const formatted = totalDebt.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const categories: { label: string; value: number }[] = [
    { label: "Rent", value: breakdown.rent },
    { label: "Late Fees", value: breakdown.late_fees },
    { label: "Klarna", value: breakdown.klarna },
    { label: "Interest", value: breakdown.interest },
  ].filter((c) => c.value > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Total Balance Due
          </span>
          <div className={`text-5xl font-bold ${getAmountColor(totalDebt)}`}>
            ${formatted}
          </div>
          {categories.length > 0 && (
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-2 flex-wrap">
              {categories.map((cat, i) => (
                <span key={cat.label} className="flex items-center gap-2">
                  {i > 0 && <span className="text-gray-300">|</span>}
                  {cat.label}: ${cat.value.toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <button
          onClick={onMakePayment}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
        >
          Make a Payment
        </button>
      </div>
    </div>
  );
}
