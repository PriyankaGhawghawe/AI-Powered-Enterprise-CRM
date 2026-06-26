import re

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(
    r"\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
)
CREDIT_CARD_REGEX = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")


def mask_pii(text: str) -> str:
    """Masks personally identifiable information (PII) in the given text.

    Replaces email addresses, phone numbers, and credit card numbers with generic placeholders.
    """
    if not isinstance(text, str):
        return text

    masked = EMAIL_REGEX.sub("[MASKED_EMAIL]", text)
    masked = PHONE_REGEX.sub("[MASKED_PHONE]", masked)
    masked = CREDIT_CARD_REGEX.sub("[MASKED_CARD]", masked)
    return masked
