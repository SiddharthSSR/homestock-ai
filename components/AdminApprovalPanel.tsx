import { ApprovalActions } from "./ApprovalActions";

export function AdminApprovalPanel({ requestId, actorId }: { requestId: string; actorId: string }) {
  return <ApprovalActions requestId={requestId} actorId={actorId} />;
}
