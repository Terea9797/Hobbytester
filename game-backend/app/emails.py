from .settings import settings

def send_email(to: str, subject: str, text: str) -> None:
    """
    DEV ONLY: prints the email that would be sent.
    Replace this with a real provider (SMTP/SendGrid/etc.) later.
    """
    banner = "=" * 30
    print(f"\n{banner} EMAIL (DEV) {banner}")
    print(f"To: {to}")
    print(f"Subject: {subject}")
    print(text)
    print(f"{'=' * (len(banner) + 14)}\n")
