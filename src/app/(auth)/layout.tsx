import { ShellBackdrop } from "@/components/chrome/shell-backdrop";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dn-shell-bg relative min-h-dvh overflow-hidden flex items-center justify-center p-6">
      <ShellBackdrop />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
