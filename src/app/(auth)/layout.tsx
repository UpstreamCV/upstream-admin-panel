export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
