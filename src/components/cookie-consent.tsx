"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "prontio_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="print:hidden fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg bg-gray-900 px-6 py-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-gray-100">
          Este site utiliza cookies essenciais para o funcionamento do sistema.
          Ao continuar navegando, você concorda com nossa{" "}
          <Link
            href="/privacidade"
            target="_blank"
            className="font-medium text-primary-400 underline hover:text-primary-300"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
