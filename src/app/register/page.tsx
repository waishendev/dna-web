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

export default function RegisterPage() {
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

  const attemptLogin = async (userEmail: string, userPassword: string) => {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      skipAuth: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
      }),
    });

    if (!response.ok) {
      return { response, token: undefined as string | undefined };
    }

    let token: string | undefined;
    try {
      const data = (await response.json()) as AuthResponse;
      token = data?.token;
    } catch (error) {
      console.error("Failed to parse /auth/login response after register", error);
    }

    return { response, token };
  };

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
      const response = await apiFetch("/auth/register", {
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
        if (response.status === 409) {
          showToast("该邮箱已被注册", "error");
        } else {
          showToast(`注册失败（${response.status}）`, "error");
        }
        return;
      }

      let token: string | undefined;
      try {
        const data = (await response.json()) as AuthResponse;
        token = data?.token;
      } catch (error) {
        console.error("Failed to parse /auth/register response", error);
      }

      if (!token) {
        try {
          const loginResult = await attemptLogin(trimmedEmail, password);
          if (!loginResult.response.ok) {
            if (loginResult.response.status === 401) {
              showToast("注册成功，但自动登录失败，请稍后重试。", "error");
            } else {
              showToast(`自动登录失败（${loginResult.response.status}）`, "error");
            }
            return;
          }

          token = loginResult.token;
        } catch (error) {
          console.error("Automatic login failed", error);
          showToast("注册成功，但自动登录时发生错误，请尝试手动登录。", "error");
          return;
        }
      }

      if (!token) {
        showToast("注册成功，但未获取到访问令牌，请尝试手动登录。", "error");
        return;
      }

      setToken(token);

      try {
        await apiFetch("/me", { cache: "no-store" });
      } catch (error) {
        console.warn("Failed to fetch /me after register", error);
      }

      redirecting = true;
      router.replace("/dashboard");
    } catch (error) {
      console.error("Register request failed", error);
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
          <p>我们正在确认您的登录状态，请稍后。</p>
        </FormCard>
      </FormLayout>
    );
  }

  return (
    <FormLayout>
      {toastElement}
      <FormRoot
        title="注册 DNA Web"
        description={
          <>
            创建一个新账户以访问控制台。
            <br />
            当前 API 地址：{apiBaseUrl || "未配置"}
          </>
        }
        footer={
          <>
            已有账号？ <FormLink href="/login">立即登录</FormLink>
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
          autoComplete="new-password"
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
          {isSubmitting ? "注册中…" : "注册"}
        </FormButton>
      </FormRoot>
    </FormLayout>
  );
}
