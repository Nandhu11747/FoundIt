from celery import shared_task
from django.core.mail import send_mail


@shared_task
def send_otp_email(email, otp):
    send_mail(
        subject="FoundIt Email Verification",
        message=f"Your FoundIt verification OTP is: {otp}",
        from_email=None,
        recipient_list=[email],
    )