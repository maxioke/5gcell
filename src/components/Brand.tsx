import { Cpu } from "lucide-react";
import { workshopSettings } from "../settings";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="brand"
      aria-label={`${workshopSettings.workshopName} Reparaciones`}
    >
      <span className="brand__mark">
        <Cpu size={19} strokeWidth={2.4} />
      </span>

      {!compact && (
        <span className="brand__wordmark">
          5G<span> CELL</span>
        </span>
      )}
    </div>
  );
}