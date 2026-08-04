import { supabase } from '@/lib/supabase';

const BUCKET = 'Weinzelt';

export async function uploadReceiptInvoicePdf({
  path,
  buffer,
}: {
  path: string;
  buffer: Buffer;
}) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: false,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(`PDF konnte nicht archiviert werden: ${error.message}`);
  }

  return path;
}

export async function downloadReceiptInvoicePdf(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    throw new Error(
      `PDF konnte nicht geladen werden: ${
        error?.message || 'Unbekannter Fehler'
      }`,
    );
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function removeReceiptInvoiceFiles(paths: string[]) {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);

  if (error) {
    console.error('Receipt invoice cleanup failed:', error);
  }
}
