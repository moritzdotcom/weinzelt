import { addressToHtml } from './address';

type DeliveryMethod = 'DELIVERY' | 'PICKUPCR' | 'PICKUPWZ';

export function renderShippingBlock(
  shippingHtml: string,
  method: DeliveryMethod,
) {
  switch (method) {
    case 'DELIVERY':
      return `
  <tr>
  <td style="padding:0 20px 16px;">
  <div style="background-color:#fff7e6; padding:16px; border-radius:5px; color:#333333; font-size:14px; line-height:1.5;">
  <p style="margin:0 0 10px;"><strong>Versand von Eintrittsbändchen &amp; Verzehrkarten</strong></p>
  <p style="margin:0 0 10px;">
  Wir senden dir deine Eintrittsbändchen und Verzehrkarten <strong>ca. 6 Wochen vor dem Weinzelt</strong> an folgende Lieferadresse:
  </p>
  <p style="margin:0; padding:10px 12px; background:#ffffff; border:1px solid #eee; border-radius:4px;">
  ${shippingHtml}
  </p>
  <p style="margin:10px 0 0;">
  Bitte prüfe, ob die Adresse korrekt ist. Falls etwas nicht stimmt, antworte einfach auf diese E-Mail.
  </p>
  </div>
  </td>
  </tr>
  `;
    case 'PICKUPCR':
      return `
  <tr>
  <td style="padding:0 20px 16px;">
  <div style="background-color:#fff7e6; padding:16px; border-radius:5px; color:#333333; font-size:14px; line-height:1.5;">
  <p style="margin:0 0 10px;"><strong>Abholung von Eintrittsbändchen &amp; Verzehrkarten</strong></p>
  
  <p style="margin:0 0 10px;">
  Da das Weinzelt bereits in wenigen Tagen startet, ist ein Versand der Eintrittsbändchen und Verzehrkarten leider nicht mehr möglich.
  </p>
  
  <p style="margin:0 0 10px;">
  Bitte hole deine Eintrittsbändchen und Verzehrkarten deshalb <strong>vor deinem Besuch im Weinzelt</strong> bei
  <strong>Concept Riesling am Carlsplatz</strong> ab:
  </p>
  
  <p style="margin:0; padding:10px 12px; background:#ffffff; border:1px solid #eee; border-radius:4px;">
  ${addressToHtml({ line1: 'Carlspl. 26', postalCode: '40213', city: 'Düsseldorf', country: 'DE' })}
  </p>
  
  <p style="margin:10px 0 0;">
  Bitte bring zur Abholung deine Reservierungsbestätigung mit. 
  <strong>Die Reservierung kann nur mit gültigem Eintrittsbändchen angetreten werden.</strong>
  </p>
  </div>
  </td>
  </tr>
  `;
    case 'PICKUPWZ':
      return `
  <tr>
  <td style="padding:0 20px 16px;">
  <div style="background-color:#fff7e6; padding:16px; border-radius:5px; color:#333333; font-size:14px; line-height:1.5;">
  <p style="margin:0 0 10px;"><strong>Abholung von Eintrittsbändchen &amp; Verzehrkarten</strong></p>
  
  <p style="margin:0 0 10px;">
  Da das Weinzelt bereits eröffnet hat, ist ein Versand der Eintrittsbändchen und Verzehrkarten leider nicht mehr möglich.
  </p>
  
  <p style="margin:0 0 10px;">
  Deine Eintrittsbändchen und Verzehrkarten liegen im Weinzelt bereit. Unser Team wird dich und deine Gruppe am Eingang in Empfang nehmen und die Reservierungsunterlagen übergeben.
  </p>
  
  <p style="margin:10px 0 0;">
  Bitte bring zur Abholung deine Reservierungsbestätigung mit. 
  </p>
  </div>
  </td>
  </tr>
  `;
  }
}
