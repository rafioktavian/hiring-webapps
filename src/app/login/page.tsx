import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const [role, setRole] = useState<"candidate" | "admin">("candidate");

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setRole("candidate")}
          style={{
            fontWeight: role === "candidate" ? "bold" : "normal",
            marginRight: "1rem",
          }}
        >
          Candidate
        </button>
        <button
          type="button"
          onClick={() => setRole("admin")}
          style={{
            fontWeight: role === "admin" ? "bold" : "normal",
          }}
        >
          Admin
        </button>
      </div>
      <LoginForm role={role} />
    </div>
  );
}

