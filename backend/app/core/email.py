from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email using SendGrid.
    """
    if not settings.SENDGRID_API_KEY:
        logger.warning("SENDGRID_API_KEY not set. Skipping email.")
        return False

    message = Mail(
        from_email=settings.EMAIL_FROM,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email sent to {to_email}. Status Code: {response.status_code}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_new_offer_notification(seller_email: str, buyer_name: str, listing_title: str, offer_amount: float):
    """
    Notify the seller of a new offer.
    """
    subject = f"New Offer: {listing_title} - Reuse Vandy"
    html_content = f"""
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #8B7D5B;">New Offer Received!</h2>
        <p>Hi there,</p>
        <p><strong>{buyer_name}</strong> has made an offer of <strong>${offer_amount:.2f}</strong> for your item: <strong>{listing_title}</strong>.</p>
        <div style="margin: 30px 0;">
            <a href="http://localhost:3000/messages" style="background-color: #8B7D5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Offer & Reply</a>
        </div>
        <p style="font-size: 12px; color: #888;">This is an automated notification from Reuse Vandy.</p>
    </div>
    """
    return await send_email(seller_email, subject, html_content)

async def send_new_message_notification(recipient_email: str, sender_name: str, listing_title: str):
    """
    Notify a user of a new message.
    """
    subject = f"New Message: {listing_title} - Reuse Vandy"
    html_content = f"""
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #8B7D5B;">New Message Received</h2>
        <p>Hi there,</p>
        <p>You have a new message from <strong>{sender_name}</strong> regarding the item: <strong>{listing_title}</strong>.</p>
        <div style="margin: 30px 0;">
            <a href="http://localhost:3000/messages" style="background-color: #8B7D5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Messages</a>
        </div>
        <p style="font-size: 12px; color: #888;">This is an automated notification from Reuse Vandy.</p>
    </div>
    """
    return await send_email(recipient_email, subject, html_content)
