"use client";

import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const body = (await response.json().catch(() => null)) as {
          user?: AuthUser | null;
        } | null;

        if (!cancelled) {
          setUser(body?.user || null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <span className="h-10 w-24 rounded-md border border-line bg-white" />
    );
  }

  if (!user) {
    return (
      <a
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-mint"
        href="/api/auth/google/start"
      >
        <LogIn aria-hidden="true" size={17} />
        <span>Sign in</span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[180px] items-center gap-2 truncate text-sm font-medium text-slate-700 sm:inline-flex">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-7 w-7 rounded-full"
            referrerPolicy="no-referrer"
            src={user.avatarUrl}
          />
        ) : (
          <UserCircle aria-hidden="true" size={22} />
        )}
        <span className="truncate">{user.name}</span>
      </span>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-mint"
        disabled={loggingOut}
        onClick={logout}
        title="Sign out"
        type="button"
      >
        <LogOut aria-hidden="true" size={17} />
      </button>
    </div>
  );
}
