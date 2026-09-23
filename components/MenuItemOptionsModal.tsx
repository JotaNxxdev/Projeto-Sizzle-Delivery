'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import type { MenuItem, SelectedOption } from '@/lib/types';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h3>{item.name}</h3>
        {item.optionGroups.map((group) => (
          <div key={group.id} style={{ marginBottom: 15 }}>
            <p style={{ fontWeight: 600, marginBottom: 5 }}>
              {group.name}{' '}
              <span style={{ color: '#666', fontWeight: 400, fontSize: '0.85rem' }}>
                ({group.minSelections > 0 ? `mín. ${group.minSelections}, ` : 'opcional, '}máx. {group.maxSelections})
              </span>
            </p>
            {group.values.map((value) => {
              const checked = (selected[group.id] ?? []).includes(value.id);
              return (
                <label key={value.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input
                    type={group.maxSelections === 1 ? 'radio' : 'checkbox'}
                    name={`group-${group.id}`}
                    checked={checked}
                    onChange={() => toggleValue(group.id, value.id, group.maxSelections)}
                    style={{ width: 18, height: 18, flexShrink: 0, margin: 0 }}
                  />
                  {value.name}
                  {value.priceDelta > 0 && ` (+${formatCurrency(value.priceDelta)})`}
                </label>
              );
            })}
          </div>
        ))}
        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Total: {formatCurrency(unitPrice)}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button
            type="button"
            className="checkout-button"
            style={{ marginTop: 0 }}
            onClick={() => onConfirm(selectedOptions, unitPrice)}
            disabled={!isValid}
          >
            Adicionar
          </button>
          <button type="button" className="add-to-cart-button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
