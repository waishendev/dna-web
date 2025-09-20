"use client";

import Link from "next/link";
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  forwardRef,
  useEffect,
  useId,
} from "react";

const layoutStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2.5rem 1.5rem",
  background: "linear-gradient(135deg, #0f172a 0%, #1f2937 100%)",
  color: "#f8fafc",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "18px",
  padding: "2.5rem",
  background: "rgba(15, 23, 42, 0.68)",
  color: "inherit",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  backdropFilter: "blur(14px)",
};

const headerStyle: CSSProperties = {
  marginBottom: "1.75rem",
};

const titleStyle: CSSProperties = {
  fontSize: "2.1rem",
  fontWeight: 700,
  marginBottom: "0.75rem",
};

const descriptionStyle: CSSProperties = {
  opacity: 0.78,
  lineHeight: 1.6,
  fontSize: "0.98rem",
};

const footerStyle: CSSProperties = {
  marginTop: "2rem",
  fontSize: "0.95rem",
  textAlign: "center",
  opacity: 0.85,
};

type CardShellProps = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

function CardShell({ title, description, footer, children }: CardShellProps) {
  return (
    <section style={panelStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{title}</h1>
        {description ? <p style={descriptionStyle}>{description}</p> : null}
      </header>
      {children}
      {footer ? <footer style={footerStyle}>{footer}</footer> : null}
    </section>
  );
}

export function FormLayout({ children }: { children: ReactNode }) {
  return <main style={layoutStyle}>{children}</main>;
}

type FormRootProps = ComponentPropsWithoutRef<"form"> & CardShellProps;

export function FormRoot({
  title,
  description,
  footer,
  children,
  noValidate,
  ...rest
}: FormRootProps) {
  return (
    <CardShell title={title} description={description} footer={footer}>
      <form
        {...rest}
        noValidate={noValidate ?? true}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {children}
      </form>
    </CardShell>
  );
}

type FormCardProps = CardShellProps;

export function FormCard({ title, description, footer, children }: FormCardProps) {
  return (
    <CardShell title={title} description={description} footer={footer}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          textAlign: "center",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          opacity: 0.85,
        }}
      >
        {children}
      </div>
    </CardShell>
  );
}

type FormFieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, id, error, style, ...props }, ref) {
    const generatedId = useId();
    const sanitizedLabel = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const inputId =
      id ?? props.name ?? (sanitizedLabel.length > 0 ? sanitizedLabel : generatedId);

    return (
      <label htmlFor={inputId} style={{ display: "block" }}>
        <span
          style={{
            display: "block",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "0.55rem",
          }}
        >
          {label}
        </span>
        <input
          {...props}
          id={inputId}
          ref={ref}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            borderRadius: "12px",
            border: `1px solid ${error ? "rgba(239, 68, 68, 0.85)" : "rgba(148, 163, 184, 0.45)"}`,
            background: "rgba(15, 23, 42, 0.35)",
            color: "#f8fafc",
            fontSize: "1rem",
            outline: "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            ...style,
          }}
        />
        {error ? (
          <span
            style={{
              display: "block",
              color: "#f97316",
              fontSize: "0.85rem",
              marginTop: "0.5rem",
            }}
          >
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);

type FormButtonProps = ComponentPropsWithoutRef<"button"> & {
  fullWidth?: boolean;
};

export function FormButton({
  fullWidth = true,
  style,
  children,
  type = "submit",
  ...props
}: FormButtonProps) {
  return (
    <button
      {...props}
      type={type}
      style={{
        width: fullWidth ? "100%" : undefined,
        padding: "0.9rem 1rem",
        borderRadius: "12px",
        border: "none",
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: 600,
        fontSize: "1rem",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.72 : 1,
        transition: "transform 0.2s ease, opacity 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

type FormLinkProps = {
  href: string;
  children: ReactNode;
};

export function FormLink({ href, children }: FormLinkProps) {
  return (
    <Link
      href={href}
      style={{
        color: "#60a5fa",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

export type ToastVariant = "default" | "error" | "success";

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

export function Toast({
  open,
  message,
  variant = "default",
  onOpenChange,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      onOpenChange?.(false);
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, duration, onOpenChange, message, variant]);

  if (!open) {
    return null;
  }

  const background =
    variant === "error"
      ? "rgba(239, 68, 68, 0.95)"
      : variant === "success"
      ? "rgba(34, 197, 94, 0.95)"
      : "rgba(37, 99, 235, 0.95)";

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "2rem",
        right: "2rem",
        maxWidth: "320px",
        padding: "1rem 1.25rem",
        borderRadius: "12px",
        background,
        color: "#ffffff",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
        fontSize: "0.95rem",
        lineHeight: 1.5,
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
}
