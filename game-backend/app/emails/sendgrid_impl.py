import logging
from typing import Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Personalization, Content, MailSettings, SandBoxMode

from ..settings import settings

logger = logging.getLogger("emails")

def _client() -> SendGridAPIClient:
    if not settings.SENDGRID_API_KEY:
        raise RuntimeError("SENDGRID_API_KEY is not set")
    return SendGridAPIClient(settings.SENDGRID_API_KEY)

def _new_mail(subject: str, to_email: str, html: str, plain: Optional[str] = None) -> Mail:
    mail = Mail()
    mail.from_email = From(settings.FROM_EMAIL, settings.FROM_NAME)
    p = Personalization()
    p.add_to(To(to_email))
    mail.add_personalization(p)
    mail.subject = subject
    mail.add_content(Content("text/plain", plain or ""))
    mail.add_content(Content("text/html", html))
    ms = MailSettings()
    ms.sandbox_mode = SandBoxMode(enable=False)
    mail.mail_settings = ms
    return mail

def send_confirm_email(
    to_email: str,
    username: str,
    confirm_link: Optional[str] = None,
    token: Optional[str] = None,
) -> bool:
    if not confirm_link:
        if not token:
            raise ValueError("send_confirm_email: provide confirm_link or token")
        confirm_link = f"{settings.BASE_URL}/auth/confirm-email?token={token}"

    html = f"""
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
      <h2>Confirm your email</h2>
      <p>Hi {username},</p>
      <p>Thanks for registering at <strong>{settings.FROM_NAME}</strong>.</p>
      <p>Please confirm your email by clicking the link below:</p>
      <p><a href="{confirm_link}" target="_blank" rel="noopener">Confirm my email</a></p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>
    """
    mail = _new_mail("Confirm your email", to_email, html, plain=f"Confirm your email: {confirm_link}")
    try:
        resp = _client().send(mail)
        logger.info("SendGrid /confirm status=%s body=%s", resp.status_code, getattr(resp, "body", b"")[:500])
        return 200 <= resp.status_code < 300
    except Exception as e:
        logger.exception("SendGrid /confirm failed: %s", e)
        return False

def send_reset_email(to_email: str, username: str, reset_link: str) -> bool:
    html = f"""
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
      <h2>Reset your password</h2>
      <p>Hi {username},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{reset_link}" target="_blank" rel="noopener">Reset password</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
    """
    mail = _new_mail("Reset your password", to_email, html, plain=f"Reset password: {reset_link}")
    try:
        resp = _client().send(mail)
        logger.info("SendGrid /reset status=%s body=%s", resp.status_code, getattr(resp, "body", b"")[:500])
        return 200 <= resp.status_code < 300
    except Exception as e:
        logger.exception("SendGrid /reset failed: %s", e)
        return False
