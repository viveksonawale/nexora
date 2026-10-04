import { SpotlightCard } from "@/app/components/SpotlightCard";
import { ShinyButton } from "@/app/components/ShinyButton";
import { CheckCircle } from "lucide-react";

interface AttendanceConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AttendanceConfirmationDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: AttendanceConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)" className="w-full max-w-sm p-6 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)] shadow-2xl relative">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2 text-[var(--text-primary)]">
            Attendance Marked
          </h2>
          <p className="font-sans text-[var(--text-secondary)] mb-6">
            {message}
          </p>
          <div className="flex w-full gap-3">
            <ShinyButton variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </ShinyButton>
            <ShinyButton variant="primary" className="flex-1" onClick={onConfirm}>
              OK
            </ShinyButton>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
