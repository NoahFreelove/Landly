"use client";

import type { Payment, KlarnaDebt } from "@/lib/types";
import { Table } from "baseui/table-semantic";
import { Tag, HIERARCHY as TAG_HIERARCHY } from "baseui/tag";

interface PaymentTableProps {
  payments: Payment[];
  klarnaDebts: KlarnaDebt[];
}

function statusPill(status: Payment["status"]) {
  const kindMap: Record<Payment["status"], string> = {
    paid: "positive",
    pending: "warning",
    overdue: "negative",
    defaulted: "negative",
  };

  return (
    <Tag
      closeable={false}
      kind={kindMap[status] as any}
      hierarchy={TAG_HIERARCHY.secondary}
      overrides={{
        Root: {
          style: {
            marginTop: '0',
            marginBottom: '0',
            marginLeft: '0',
            marginRight: '0',
            borderTopLeftRadius: '0.25rem',
            borderTopRightRadius: '0.25rem',
            borderBottomLeftRadius: '0.25rem',
            borderBottomRightRadius: '0.25rem',
            paddingTop: '2px',
            paddingBottom: '2px',
            paddingLeft: '8px',
            paddingRight: '8px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            height: 'auto',
          },
        },
        Text: {
          style: {
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      }}
    >
      {status}
    </Tag>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function klarnaStatusBadge(debt: KlarnaDebt) {
  const isOverdue = debt.status === "overdue";
  return (
    <Tag
      closeable={false}
      kind={isOverdue ? "negative" as any : debt.status === "completed" ? "positive" as any : "custom" as any}
      hierarchy={TAG_HIERARCHY.secondary}
      overrides={{
        Root: {
          style: {
            marginTop: '0',
            marginBottom: '0',
            marginLeft: '0',
            marginRight: '0',
            borderTopLeftRadius: '0.25rem',
            borderTopRightRadius: '0.25rem',
            borderBottomLeftRadius: '0.25rem',
            borderBottomRightRadius: '0.25rem',
            fontSize: '10px',
            fontWeight: 700,
            height: 'auto',
            ...(!isOverdue && debt.status !== "completed"
              ? {
                  backgroundColor: 'rgba(255, 179, 199, 0.1)',
                  color: '#e11d89',
                  borderTopColor: 'rgba(255, 179, 199, 0.3)',
                  borderRightColor: 'rgba(255, 179, 199, 0.3)',
                  borderBottomColor: 'rgba(255, 179, 199, 0.3)',
                  borderLeftColor: 'rgba(255, 179, 199, 0.3)',
                }
              : {}),
          },
        },
      }}
    >
      {debt.installments_paid}/{debt.installments} paid
    </Tag>
  );
}

export default function PaymentTable({
  payments,
  klarnaDebts,
}: PaymentTableProps) {
  const tableData = payments.map((p) => [
    <span key="type" className="text-gray-700 font-medium capitalize text-xs">
      {p.payment_type.replace("_", " ")}
    </span>,
    <span key="amount" className="font-mono text-gray-900 text-xs">
      ${p.amount.toFixed(2)}
    </span>,
    <span key="status">{statusPill(p.status)}</span>,
    <span key="due" className="text-gray-500 font-mono text-xs">
      {formatDate(p.due_date)}
    </span>,
    p.accrued_interest > 0 ? (
      <span key="interest" className="text-red-500 font-mono text-xs">
        +${p.accrued_interest.toFixed(2)}
      </span>
    ) : (
      <span key="interest" className="text-gray-400 font-mono text-xs">--</span>
    ),
  ]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Payment History</h3>
        <span className="text-[10px] font-mono text-gray-400">
          {payments.length} record{payments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          columns={["Type", "Amount", "Status", "Due", "Interest"]}
          data={tableData}
          emptyMessage="No payment records found."
          overrides={{
            Root: {
              style: {
                backgroundColor: 'transparent',
              },
            },
            Table: {
              style: {
                width: '100%',
                backgroundColor: 'transparent',
              },
            },
            TableHead: {
              style: {
                backgroundColor: 'transparent',
              },
            },
            TableHeadRow: {
              style: {
                borderBottomColor: '#e5e7eb',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
              },
            },
            TableHeadCell: {
              style: {
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                borderBottomColor: '#e5e7eb',
              },
            },
            TableBody: {
              style: {
                backgroundColor: 'transparent',
              },
            },
            TableBodyRow: {
              style: {
                borderBottomColor: '#f3f4f6',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                ':hover': {
                  backgroundColor: '#f9fafb',
                },
              },
            },
            TableBodyCell: {
              style: {
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                color: '#111827',
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                borderBottomColor: '#f3f4f6',
              },
            },
            TableEmptyMessage: {
              style: {
                color: '#9ca3af',
                fontSize: '0.75rem',
                textAlign: 'center',
                padding: '2rem 1rem',
              },
            },
          }}
        />
      </div>

      {/* Klarna Section */}
      {klarnaDebts.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50">
            <span className="text-[#FFB3C7] font-bold text-sm italic font-serif">
              Klarna.
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Installment Plans
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {klarnaDebts.map((debt) => (
              <div
                key={debt.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-700 font-medium">
                    {debt.item_name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ${debt.total_amount.toFixed(2)} total
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {klarnaStatusBadge(debt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
