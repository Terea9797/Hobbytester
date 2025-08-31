import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .settings import settings

def send_email(to: str, subject: str, text: str):
    message = Mail(
        from_email="no-reply@yourdomain.com",
        to_emails=to,
        subject=subject,
        plain_text_content=text
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
        print(f"✅ Email sent to {to}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
