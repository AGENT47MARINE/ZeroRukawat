"""
GigShield — Notification Service
WhatsApp (Twilio) + Firebase FCM stubs.
Logs notifications to console for hackathon demo.
"""

import os

# In production, these would be real credentials
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")


def send_whatsapp(phone: str, message: str) -> dict:
    """
    Send WhatsApp notification via Twilio.
    Currently a stub — logs to console.

    phone: e.g. "+919876543210"
    message: notification text
    """
    formatted = f"whatsapp:{phone}" if not phone.startswith("whatsapp:") else phone

    # Stub: log instead of sending
    print(f"📱 [WhatsApp → {formatted}] {message}")

    return {
        "status": "sent_stub",
        "to": formatted,
        "message": message,
        "sid": "STUB_SID_" + phone[-4:],
    }


def send_fcm(device_token: str, title: str, body: str, data: dict = None) -> dict:
    """
    Send Firebase Cloud Messaging push notification.
    Currently a stub — logs to console.

    device_token: FCM device registration token
    title: notification title
    body: notification body
    data: optional payload dict
    """
    print(f"🔔 [FCM → {device_token[:12]}…] {title}: {body}")

    return {
        "status": "sent_stub",
        "device_token": device_token[:12] + "…",
        "title": title,
        "body": body,
        "data": data or {},
    }


def notify_payout(worker_phone: str, device_token: str, payout_amount: float,
                   disruption_type: str, zone: str) -> dict:
    """
    Convenience: send both WhatsApp and FCM for a payout notification.
    """
    message = (
        f"💰 GigShield Payout Alert!\n"
        f"Amount: ₹{payout_amount:.2f}\n"
        f"Reason: {disruption_type.replace('_', ' ').title()}\n"
        f"Zone: {zone}\n"
        f"Credited to your UPI within 15 minutes."
    )

    whatsapp_result = send_whatsapp(worker_phone, message)
    fcm_result = send_fcm(
        device_token,
        title="GigShield Payout",
        body=f"₹{payout_amount:.2f} credited for {disruption_type.replace('_', ' ')}",
        data={"payout_amount": str(payout_amount), "zone": zone},
    )

    return {
        "whatsapp": whatsapp_result,
        "fcm": fcm_result,
    }
