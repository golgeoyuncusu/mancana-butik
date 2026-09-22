import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="auth-shell">
      <SignIn />
    </div>
  );
}
