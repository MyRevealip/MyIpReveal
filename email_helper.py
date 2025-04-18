import os
import logging
import base64
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, Attachment, FileContent, FileName, FileType, Disposition

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_privacy_guide_email(recipient_email):
    """
    Sends the privacy guide as an attachment to the specified email address.
    
    Args:
        recipient_email (str): The email address to send the guide to
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Get API key from environment variables
    api_key = os.environ.get('SENDGRID_API_KEY')
    if not api_key:
        logger.error("SENDGRID_API_KEY environment variable not set")
        return False
    
    # Path to the PDF file
    pdf_path = os.path.join(os.path.dirname(__file__), 'static', 'downloads', 'privacy.pdf')
    if not os.path.exists(pdf_path):
        logger.error(f"PDF file not found at path: {pdf_path}")
        return False
    
    try:
        # Read the PDF file
        with open(pdf_path, 'rb') as f:
            file_content = f.read()
            encoded_file = base64.b64encode(file_content).decode()
            
        # Create the email
        from_email = Email("noreply@myipreveal.com")  # Update with your sending email
        to_email = To(recipient_email)
        subject = "Your IP Address Privacy Guide from MyIPReveal.com"
        content = Content(
            "text/html", 
            """
            <html>
                <body>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #2196F3;">Your IP Address Privacy Guide</h1>
                        </div>
                        
                        <p>Hello,</p>
                        
                        <p>Thank you for subscribing to MyIPReveal.com. As promised, attached you'll find your comprehensive 25-page IP Address Privacy Guide.</p>
                        
                        <p>This guide includes:</p>
                        <ul>
                            <li>How to protect your identity online</li>
                            <li>Methods to avoid IP-based tracking</li>
                            <li>Step-by-step instructions for securing your connections</li>
                            <li>Recommended tools and services for enhanced privacy</li>
                        </ul>
                        
                        <p>We hope you find this guide valuable. If you have any questions, feel free to reply to this email.</p>
                        
                        <p>Best regards,<br>
                        The MyIPReveal.com Team</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            This email was sent to you because you requested the IP Address Privacy Guide from MyIPReveal.com.<br>
                            You can <a href="https://myipreveal.com/unsubscribe?email={recipient_email}">unsubscribe</a> at any time.
                        </p>
                    </div>
                </body>
            </html>
            """
        )
        
        mail = Mail(from_email, to_email, subject, content)
        
        # Add the attachment
        attachment = Attachment()
        attachment.file_content = FileContent(encoded_file)
        attachment.file_type = FileType('application/pdf')
        attachment.file_name = FileName('IP_Address_Privacy_Guide.pdf')
        attachment.disposition = Disposition('attachment')
        mail.attachment = attachment
        
        # Send the email
        sg = SendGridAPIClient(api_key)
        response = sg.send(mail)
        
        # Log the response
        logger.info(f"Email sent to {recipient_email} with status code: {response.status_code}")
        
        return response.status_code >= 200 and response.status_code < 300
        
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False


def send_welcome_email(recipient_email):
    """
    Sends a welcome email to new subscribers.
    
    Args:
        recipient_email (str): The email address to send the welcome email to
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Get API key from environment variables
    api_key = os.environ.get('SENDGRID_API_KEY')
    if not api_key:
        logger.error("SENDGRID_API_KEY environment variable not set")
        return False
    
    try:
        # Create the email
        from_email = Email("noreply@myipreveal.com")  # Update with your sending email
        to_email = To(recipient_email)
        subject = "Welcome to MyIPReveal.com"
        content = Content(
            "text/html", 
            """
            <html>
                <body>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #2196F3;">Welcome to MyIPReveal.com</h1>
                        </div>
                        
                        <p>Hello,</p>
                        
                        <p>Thank you for subscribing to MyIPReveal.com. We're excited to have you join our community of privacy-conscious internet users.</p>
                        
                        <p>Here are some resources you might find useful:</p>
                        <ul>
                            <li><a href="https://myipreveal.com/ip-address-lookup">IP Address Lookup Tool</a></li>
                            <li><a href="https://myipreveal.com/my-ip-address-location">IP Geolocation</a></li>
                            <li><a href="https://myipreveal.com/ipv6-check">IPv6 Test</a></li>
                        </ul>
                        
                        <p>Stay tuned for occasional updates on internet privacy and security.</p>
                        
                        <p>Best regards,<br>
                        The MyIPReveal.com Team</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            This email was sent to you because you subscribed to MyIPReveal.com.<br>
                            You can <a href="https://myipreveal.com/unsubscribe?email={recipient_email}">unsubscribe</a> at any time.
                        </p>
                    </div>
                </body>
            </html>
            """
        )
        
        mail = Mail(from_email, to_email, subject, content)
        
        # Send the email
        sg = SendGridAPIClient(api_key)
        response = sg.send(mail)
        
        # Log the response
        logger.info(f"Welcome email sent to {recipient_email} with status code: {response.status_code}")
        
        return response.status_code >= 200 and response.status_code < 300
        
    except Exception as e:
        logger.error(f"Error sending welcome email: {str(e)}")
        return False