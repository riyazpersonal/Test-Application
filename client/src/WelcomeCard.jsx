import { User } from "lucide-react";

export default function WelcomeCard({ username, active }) {
  return (
    <div className="welcome-card">
      <div className="avatar">
        <User size={22} />
      </div>
      <div>
        <div className="welcome-line">
          Welcome, <span className="username">{username || "…"}</span>
        </div>
        <span className={`status-badge${active ? "" : " status-badge-off"}`}>
          {active ? "ACTIVE USER" : "CHECKING…"}
        </span>
      </div>
    </div>
  );
}
