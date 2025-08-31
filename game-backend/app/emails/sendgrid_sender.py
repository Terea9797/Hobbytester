from os import getenv
from pathlib import Path
from string import Template

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From

from ..settings import settings

TEMPLATES_DIR = Path(__file__).with_suffix("").parent / "templates"

def render_template(name: str, **context) -> str:
    """Very simple templating using string.Template (Jinja not required)."""
    html = (TEMPLATES_DIR / name).read_text(encoding="utf-8")
    # Convert {{ var }} to $var for Template
    for k, v in context.items():
        html = html.replace("{{ " + k + " }}", str(v))
    return html

def send_email_html(to_email: str, subject: str, html: str, plain_text: str | None = None):
    api_key = getenv("SENDGRID_API_KEY", "") or settings.__dict__.get("SENDGRID_API_KEY","")
    if not api_key:
        raise RuntimeError("SENDGRID_API_KEY is missing")

    from_email = From(getenv("FROM_EMAIL", "no-reply@example.com"), getenv("FROM_NAME", "City of Shadows"))
    message = Mail(from_email=from_email, to_emails=to_email, subject=subject, html_content=html)
    if plain_text:
        message.add_content(Mail.PlainTextContent(plain_text))

    sg = SendGridAPIClient(api_key)
    return sg.send(message)
