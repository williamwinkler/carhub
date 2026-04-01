"use client";

import { useEffect, useRef } from "react";
import { useLogin } from "../../../hooks/useLogin";
import { useAuth } from "../../../lib/auth-context";

interface NavbarLoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function NavbarLoginForm({
  isOpen,
  onClose,
  onToggle,
}: NavbarLoginFormProps) {
  const { login } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    username,
    setUsername,
    password,
    setPassword,
    hasError,
    setHasError,
    handleLogin,
    reset: resetLogin,
    isLoading: isLoginLoading,
  } = useLogin({
    onSuccess: (userInfo) => {
      login(userInfo);
      onClose();
      resetLogin();
    },
  });

  // Close login on Escape key or click outside
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        if (isOpen) {
          handleLogin();
        }
      }}
      className="flex items-center space-x-2"
    >
      {/* Username Input - slides in first */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (hasError) setHasError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isOpen) {
              e.preventDefault();
              handleLogin();
            }
          }}
          autoComplete="username"
          className={`w-[140px] px-3 py-2 text-sm bg-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
            hasError
              ? "border border-red-500/70 focus:border-red-400/70 focus:ring-red-400/20"
              : "border border-slate-600/50 focus:border-blue-400/50 focus:ring-blue-400/20"
          }`}
          required={isOpen}
          aria-label="Username"
          aria-required="true"
          aria-invalid={hasError}
        />
      </div>

      {/* Password Input - slides in second with delay */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-w-[140px] opacity-100 delay-100" : "max-w-0 opacity-0"
        }`}
      >
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (hasError) setHasError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isOpen) {
              e.preventDefault();
              handleLogin();
            }
          }}
          autoComplete="current-password"
          className={`w-[140px] px-3 py-2 text-sm bg-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
            hasError
              ? "border border-red-500/70 focus:border-red-400/70 focus:ring-red-400/20"
              : "border border-slate-600/50 focus:border-blue-400/50 focus:ring-blue-400/20"
          }`}
          required={isOpen}
          aria-label="Password"
          aria-required="true"
          aria-invalid={hasError}
        />
      </div>

      {/* Login Button */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            handleLogin();
          } else {
            onToggle();
          }
        }}
        disabled={isOpen && isLoginLoading}
        className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50 disabled:opacity-50"
        aria-label={isOpen ? "Submit login" : "Open login form"}
        aria-expanded={isOpen}
      >
        {isOpen && isLoginLoading ? "..." : "Login"}
      </button>
    </form>
  );
}
