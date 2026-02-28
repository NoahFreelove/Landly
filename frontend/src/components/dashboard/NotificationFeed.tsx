"use client";

interface Notification {
  id: number;
  title: string;
  message: string;
  category: "warning" | "violation" | "maintenance" | "general";
  created_at: string;
  is_read: boolean;
}

interface NotificationFeedProps {
  notifications: Notification[];
}

function categoryIcon(category: Notification["category"]) {
  switch (category) {
    case "warning":
      return (
        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      );
    case "violation":
      return (
        <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
      );
    case "maintenance":
      return (
        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
  }
}

function formatTimestamp(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}

export default function NotificationFeed({
  notifications,
}: NotificationFeedProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-900">Notifications</h3>
        </div>
        <span className="text-[10px] font-mono text-gray-500">
          {notifications.filter((n) => !n.is_read).length} unread
        </span>
      </div>

      {/* Scrollable List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
        {notifications.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400 text-xs">
            No notifications at this time.
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-5 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
              !n.is_read ? "bg-blue-50/30" : ""
            }`}
          >
            {categoryIcon(n.category)}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={`text-xs font-semibold truncate ${
                    !n.is_read ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {n.title}
                </h4>
                <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formatTimestamp(n.created_at)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                {n.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
