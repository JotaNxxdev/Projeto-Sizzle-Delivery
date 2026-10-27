'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import type { MenuItem, SelectedOption } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Radio from '@/components/ui/Radio';

interface Props {
  item: MenuItem;
  onConfirm: (selectedOptions: SelectedOption[], unitPrice: number) => void;
  onClose: () => void;
}

export default function MenuItemOptionsModal({ item, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  function toggleValue(groupId: string, valueId: string, max: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (max === 1) {
        return { ...prev, [groupId]: current[0] === valueId ? [] : [valueId] };
      }
      if (current.includes(valueId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== valueId) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, valueId] };
    });
  }

  const selectedOptions: SelectedOption[] = item.optionGroups.flatMap((group) =>
    (selected[group.id] ?? []).flatMap((valueId) => {
      const value = group.values.find((v) => v.id === valueId);
      if (!value) return [];
      return [{ groupId: group.id, groupName: group.name, valueId: value.id, valueName: value.name, priceDelta: value.priceDelta }];
    })
  );

  const unitPrice = item.price + selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);

  const isValid = item.optionGroups.every((group) => {
    const count = (selected[group.id] ?? []).length;
    return count >= group.minSelections && count <= group.maxSelections;
  });

  return (
    <Modal
      title={item.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onConfirm(selectedOptions, unitPrice)} disabled={!isValid}>
            Adicionar — {formatCurrency(unitPrice)}
          </Button>
        </>
      }
    >
      {item.optionGroups.map((group) => (
        <div key={group.id} className="option-group">
          <p className="option-group-title">
            {group.name}{' '}
            <span className="option-group-hint">
              ({group.minSelections > 0 ? `mín. ${group.minSelections}, ` : 'opcional, '}máx. {group.maxSelections})
            </span>
          </p>
          {group.values.map((value) => {
            const checked = (selected[group.id] ?? []).includes(value.id);
            const label = (
              <>
                {value.name}
                {value.priceDelta > 0 && ` (+${formatCurrency(value.priceDelta)})`}
              </>
            );
            return group.maxSelections === 1 ? (
              <Radio
                key={value.id}
                className="option-value"
                name={`group-${group.id}`}
                checked={checked}
                onChange={() => toggleValue(group.id, value.id, group.maxSelections)}
                label={label}
              />
            ) : (
              <Checkbox
                key={value.id}
                className="option-value"
                checked={checked}
                onChange={() => toggleValue(group.id, value.id, group.maxSelections)}
                label={label}
              />
            );
          })}
        </div>
      ))}
    </Modal>
  );
}
