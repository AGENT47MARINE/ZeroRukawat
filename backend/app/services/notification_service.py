"""
Notification service stubs.
Dev: logs to console.
Prod: replace stubs with Firebase Cloud Messaging (FCM) + Twilio WhatsApp API.
"""
from flask import current_app


def send_push(worker_id: str, title: str, body: str) -> bool:
    """FCM push notification stub."""
    current_app.logger.info(f"[FCM STUB] worker={worker_id} | {title}: {body}")
    return True


def send_whatsapp(phone: str, message: str) -> bool:
    """Twilio WhatsApp stub."""
    current_app.logger.info(f"[WHATSAPP STUB] to={phone} | {message}")
    return True


def notify_payout_approved(worker, amount: float, disruption_type: str):
    send_push(
        worker_id=worker.id,
        title="✅ Payout Approved!",
        body=f"₹{amount:.0f} credited to your UPI for {disruption_type}.",
    )
    send_whatsapp(
        phone=worker.phone,
        message=(
            f"ZeroRukawat: ₹{amount:.0f} has been credited to {worker.upi_id} "
            f"for {disruption_type} disruption. Stay safe! 🙏"
        ),
    )


def notify_claim_amber(worker):
    send_push(
        worker_id=worker.id,
        title="⏳ Claim Under Review",
        body="Your claim is being verified. We'll update you within 2 hours.",
    )


def notify_claim_blocked(worker, reason: str):
    send_push(
        worker_id=worker.id,
        title="❌ Claim Rejected",
        body=f"Reason: {reason}. Appeal via WhatsApp.",
    )
    send_whatsapp(
        phone=worker.phone,
        message=f"ZeroRukawat: Your claim was rejected. Reason: {reason}. Reply to appeal.",
    )
