import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { ReceiptInvoiceCreator } from '@/components/backend/receiptInvoices/ReceiptInvoiceCreator';
import type { Session } from '@/hooks/useSession';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';

export default function NewReceiptInvoicePage({
  session,
}: {
  session: Session;
}) {
  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.INVOICES}
      deniedTitle="Kein Zugriff auf Rechnungen"
      deniedDescription="Du hast keine Berechtigung, Rechnungsergänzungen zu erstellen."
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <ReceiptInvoiceCreator />
      </div>
    </BackendPermissionGuard>
  );
}
