"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FormButton,
  FormCard,
  FormField,
  FormLayout,
  FormLink,
  FormRoot,
  Toast,
  type ToastVariant,
} from "@/components/ui/Form";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";

type FieldErrors = {
  email?: string;
  password?: string;
};

type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type AuthResponse = {
  token?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, variant: ToastVariant = "error") => {
    setToast({ id: Date.now(), message, variant });
  };

  useEffect(() => {
    let active = true;
    const token = getToken();

    if (!token) {
      setCheckingSession(false);
      return;
    }

    const verifySession = async () => {
      try {
        const response = await apiFetch("/me", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Session check failed with status ${response.status}`);
        }
        router.replace("/dashboard");
      } catch (error) {
        console.warn("Session check failed", error);
        clearToken();
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    void verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors: FieldErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = "请输入邮箱地址";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = "邮箱格式不正确";
    }

    if (!password) {
      nextErrors.password = "请输入密码";
    } else if (password.length < 6) {
      nextErrors.password = "密码至少 6 位";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    let redirecting = false;

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        skipAuth: true,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast("邮箱或密码错误", "error");
        } else {
          showToast(`登录失败（${response.status}）`, "error");
        }
        return;
      }

      let token: string | undefined;
      try {
        const data = (await response.json()) as AuthResponse;
        token = data?.token;
      } catch (error) {
        console.error("Failed to parse /auth/login response", error);
      }

      if (!token) {
        showToast("登录失败：服务未返回访问令牌", "error");
        return;
      }

      setToken(token);

      try {
        await apiFetch("/me", { cache: "no-store" });
      } catch (error) {
        console.warn("Failed to fetch /me after login", error);
      }

      redirecting = true;
      router.replace("/dashboard");
    } catch (error) {
      console.error("Login request failed", error);
      showToast("无法连接到服务器，请稍后再试", "error");
    } finally {
      if (!redirecting) {
        setIsSubmitting(false);
      }
    }
  };

  const apiBaseUrl = getApiBaseUrl();
  const toastElement = toast ? (
    <Toast
      key={toast.id}
      open
      message={toast.message}
      variant={toast.variant}
      onOpenChange={(open) => {
        if (!open) {
          setToast(null);
        }
      }}
    />
  ) : null;

  if (checkingSession) {
    return (
      <FormLayout>
        {toastElement}
        <FormCard title="请稍候" description="正在验证当前会话…">
          <p>我们正在为您检查登录状态，请稍后。</p>
        </FormCard>
      </FormLayout>
    );
  }

  return (
    <FormLayout>
      {toastElement}
      <FormRoot
        title="登录 DNA Web"
        description={
          <>
            欢迎回来！
            <br />
            当前 API 地址：{apiBaseUrl || "未配置"}
          </>
        }
        footer={
          <>
            还没有账号？ <FormLink href="/register">立即注册</FormLink>
          </>
        }
        onSubmit={handleSubmit}
      >
        <FormField
          label="邮箱"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          error={fieldErrors.email}
        />
        <FormField
          label="密码"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="至少 6 位"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          error={fieldErrors.password}
        />
        <FormButton disabled={isSubmitting}>
          {isSubmitting ? "登录中…" : "登录"}
        </FormButton>
      </FormRoot>
    </FormLayout>
  );
}
