from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import get_settings

settings = get_settings()


def send_verification_email(email_to: str, token: str) -> None:
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    subject = "Verify your email for Reuse Vandy"
    html_content = (
        f"<h1>Welcome to Reuse Vandy!</h1>"
        f"<p>Please verify your email by clicking the link below:</p>"
        f"<a href='{verification_link}'>Verify Email</a>"
        f"<br><br>"
        f"<p>If you did not sign up for this account, please ignore this email.</p>"
    )

    message = Mail(
        from_email=settings.EMAIL_FROM,
        to_emails=email_to,
        subject=subject,
        html_content=html_content
    )
    
    try:
        if settings.SENDGRID_API_KEY:
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)
            print(f"Email sent. Status Code: {response.status_code}")
        else:
            print("SENDGRID_API_KEY not set. Email not sent.")
            print(f"Simulated Email to {email_to}: {verification_link}")
    except Exception as e:
        print(f"Error sending email: {e}")
