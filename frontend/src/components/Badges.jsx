import { STATUS_COLORS, PRIORITY_COLORS, cn } from '../lib/utils';

export function StatusBadge({ status }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] || 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={cn('badge', PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-700')}>
      {priority}
    </span>
  );
}
