export type NewsletterPayload = {
  subject: string;
  headline: string;
  body: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type NewsletterPayloadErrors = Partial<
  Record<keyof NewsletterPayload, string>
>;

function optionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();

  return trimmed || undefined;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateNewsletterPayload(input: unknown):
  | {
      success: true;
      data: NewsletterPayload;
    }
  | {
      success: false;
      errors: NewsletterPayloadErrors;
    } {
  const payload =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const subject = optionalString(payload.subject) || '';
  const headline = optionalString(payload.headline) || '';
  const body = optionalString(payload.body) || '';
  const imageUrl = optionalString(payload.imageUrl);
  const ctaLabel = optionalString(payload.ctaLabel);
  const ctaUrl = optionalString(payload.ctaUrl);

  const errors: NewsletterPayloadErrors = {};

  if (!subject) {
    errors.subject = 'Bitte gib einen Betreff ein.';
  }

  if (!headline) {
    errors.headline = 'Bitte gib eine Überschrift ein.';
  }

  if (!body) {
    errors.body = 'Bitte gib einen Text ein.';
  }

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    errors.imageUrl = 'Bitte gib eine gültige Bild-URL ein.';
  }

  if (ctaUrl && !ctaLabel) {
    errors.ctaLabel = 'Bitte gib eine Beschriftung für den Button ein.';
  }

  if (ctaLabel && !ctaUrl) {
    errors.ctaUrl = 'Bitte hinterlege ein Ziel für den Button.';
  }

  if (ctaUrl && !isValidHttpUrl(ctaUrl)) {
    errors.ctaUrl = 'Bitte gib eine gültige URL ein.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      subject,
      headline,
      body,
      imageUrl,
      ctaLabel,
      ctaUrl,
    },
  };
}
