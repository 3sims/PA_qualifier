'use client';

import type { ContextualAlert } from '@/lib/types';

interface AlertBannerProps {
  alerts: ContextualAlert[];
  /** Si true, affiche seulement les alertes 'critical' */
  criticalOnly?: boolean;
}

const SEVERITY_STYLES = {
  critical: 'border-red-300 bg-red-50 text-red-900',
  warning:  'border-amber-300 bg-amber-50 text-amber-900',
  info:     'border-blue-200 bg-blue-50 text-blue-900',
};

const SEVERITY_ICON = {
  critical: '🔴',
  warning:  '⚠️',
  info:     'ℹ️',
};

export function AlertBanner({ alerts, criticalOnly = false }: AlertBannerProps) {
  const visible = criticalOnly
    ? alerts.filter((a) => a.severity === 'critical')
    : alerts;

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((alert) => (
        <div
          key={alert.piege_id}
          className={`rounded-lg border px-4 py-3 text-sm ${SEVERITY_STYLES[alert.severity]}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">{SEVERITY_ICON[alert.severity]}</span>
            <div className="flex-1">
              <div className="font-semibold mb-0.5">
                Piège #{alert.piege_id} — {alert.title}
              </div>
              {alert.situation_concrete && (
                <div className="text-xs mb-1 opacity-80">{alert.situation_concrete}</div>
              )}
              <div className="text-xs opacity-70">{alert.regle}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
