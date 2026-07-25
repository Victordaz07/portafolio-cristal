"use client";

import { CloseIcon } from "@/components/icons";
import AdminLoginForm from "@/components/AdminLoginForm";

export default function AdminLoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-sp-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-md border border-line bg-white p-sp-6 shadow-lg"
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-sp-4 top-sp-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
          Panel privado
        </p>
        <h2 className="font-bodoni italic font-bold uppercase text-xl text-ink mb-sp-6">
          Crislia — Admin
        </h2>

        <AdminLoginForm onSuccess={onClose} />
      </div>
    </div>
  );
}
