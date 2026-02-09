import { Check, X } from 'lucide-react';
import {
  FORM_BOX_DEFINITIONS,
  type IncomeFormType,
  type BoxDefinition,
} from '@/lib/constants';
import { formatCents } from '@/lib/utils';

type BoxLayoutProps = {
  formType: IncomeFormType;
  boxes: Record<string, number | string | boolean>;
};

const SECTION_LABELS: Record<BoxDefinition['section'], string> = {
  federal: 'Federal',
  state: 'State',
  local: 'Local',
  other: 'Other',
};

function formatValue(def: BoxDefinition, value: number | string | boolean | undefined): React.ReactNode {
  // Handle checkbox type
  if (def.type === 'checkbox') {
    if (value === true) {
      return <Check className="size-4 text-positive" />;
    }
    return <X className="size-4 text-muted-foreground/30" />;
  }

  // Handle empty values
  const hasValue = value !== undefined && value !== '' && value !== 0;
  if (!hasValue) {
    return <span className="text-muted-foreground/50">—</span>;
  }

  // Handle money type
  if (def.type === 'money' && typeof value === 'number') {
    return formatCents(value);
  }

  // Handle text type
  return String(value);
}

export function BoxLayout({ formType, boxes }: BoxLayoutProps) {
  const definitions = FORM_BOX_DEFINITIONS[formType] ?? [];

  const sections = definitions.reduce<
    Record<string, BoxDefinition[]>
  >((acc, def) => {
    const section = def.section;
    if (!acc[section]) acc[section] = [];
    acc[section].push(def);
    return acc;
  }, {});

  const sectionOrder: BoxDefinition['section'][] = [
    'federal',
    'state',
    'local',
    'other',
  ];

  return (
    <div className="space-y-6">
      {sectionOrder.map((section) => {
        const defs = sections[section];
        if (!defs || defs.length === 0) return null;

        return (
          <div key={section}>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              {SECTION_LABELS[section]}
            </h4>
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {defs.map((def) => {
                const value = boxes[def.key];
                const hasValue = def.type === 'checkbox' 
                  ? value === true 
                  : value !== undefined && value !== '' && value !== 0;

                return (
                  <div
                    key={def.key}
                    className="flex items-center justify-between border-b py-1.5"
                  >
                    <span className="text-sm text-muted-foreground">
                      {def.label}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        hasValue ? '' : 'text-muted-foreground/50'
                      }`}
                    >
                      {formatValue(def, value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
