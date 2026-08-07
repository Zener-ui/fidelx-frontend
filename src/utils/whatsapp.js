// Support/admin WhatsApp numbers used for the vendor/rider
// verification contact button. Fidelx Verification Team numbers.
const VERIFICATION_NUMBERS = ["2348134195646", "2348143664378"];

/**
 * Builds a wa.me link pre-filled with a message matching the
 * verification-team template, using the applicant's name and
 * application/vendor(or rider) ID where available. Falls back
 * gracefully if either is missing rather than sending a broken
 * template.
 */
export function buildVerificationWhatsAppLink({ role, name, applicationId, numberIndex = 0 }) {
  const number = VERIFICATION_NUMBERS[numberIndex] || VERIFICATION_NUMBERS[0];

  const namePart = name || "[Name]";
  const idPart = applicationId || "[ID]";

  const text =
    role === "rider"
      ? `Hello Fidelx Verification Team, I have registered as a rider and would like to complete my verification. My name is ${namePart} and my application/rider ID is ${idPart}.`
      : `Hello Fidelx Verification Team, I have registered as a vendor and would like to complete my verification. My name is ${namePart} and my application/vendor ID is ${idPart}.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const VERIFICATION_WHATSAPP_NUMBERS = VERIFICATION_NUMBERS;
export const hasSupportWhatsApp = () => true;
