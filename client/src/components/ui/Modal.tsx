'use client';

import React from 'react';
import { X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'danger' | 'info' | 'success';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'info',
}: ModalProps) {
  if (!isOpen) return null;

  const Icon =
    variant === 'danger'
      ? AlertTriangle
      : variant === 'success'
      ? CheckCircle2
      : Info;

  const iconColor =
    variant === 'danger'
      ? 'var(--color-danger)'
      : variant === 'success'
      ? 'var(--color-success)'
      : 'var(--color-primary)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Icon size={20} style={{ color: iconColor }} />
            <span className="modal-title">{title}</span>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">{description}</div>

        <div className="modal-actions">
          {onConfirm && (
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            className={`btn btn-sm ${
              variant === 'danger' ? 'btn-danger' : 'btn-primary'
            }`}
            onClick={async () => {
              if (onConfirm) await onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
