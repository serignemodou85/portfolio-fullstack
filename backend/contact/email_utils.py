from django.conf import settings
from django.core.mail import send_mail


def _admin_recipients():
    recipients = list(getattr(settings, 'CONTACT_ADMIN_EMAILS', []) or [])
    if recipients:
        return recipients
    fallback = getattr(settings, 'EMAIL_HOST_USER', '')
    return [fallback] if fallback else []


def send_client_acknowledgement(contact_message):
    if not getattr(settings, 'CONTACT_AUTO_REPLY_ENABLED', True):
        return

    if not contact_message.email:
        return

    subject = "Message recu - Portfolio"
    body = (
        f"Bonjour {contact_message.name},\n\n"
        "Votre message a bien ete recu.\n"
        "Je vous repondrai des que possible.\n\n"
        "Resume de votre message:\n"
        f"Sujet: {contact_message.subject}\n"
        f"Message: {contact_message.message}\n\n"
        "Merci."
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[contact_message.email],
        fail_silently=False,
    )


def send_admin_notification(contact_message):
    recipients = _admin_recipients()
    if not recipients:
        return

    subject = f"Nouveau message contact: {contact_message.subject}"
    body = (
        "Nouveau message recu depuis le formulaire contact.\n\n"
        f"Nom: {contact_message.name}\n"
        f"Email: {contact_message.email}\n"
        f"Telephone: {contact_message.phone or '-'}\n"
        f"Sujet: {contact_message.subject}\n"
        f"Message:\n{contact_message.message}\n"
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipients,
        fail_silently=False,
    )


def send_manual_reply(contact_message, reply_message):
    if not contact_message.email:
        return

    clean_reply = (reply_message or '').strip()
    subject = f"Reponse a votre message - {contact_message.subject}"
    body = (
        f"Bonjour {contact_message.name},\n\n"
        f"Merci pour votre message concernant : \"{contact_message.subject}\".\n"
        "Je confirme avoir bien recu votre demande.\n\n"
        "Ma reponse :\n"
        f"{clean_reply}\n\n"
        "Si vous le souhaitez, nous pouvons poursuivre l'echange par email ou appel telephonique.\n\n"
        "Cordialement,\n"
        "Modou FALL\n"
        "Data Scientist & Data Enginner | Developpeur Full Stack"
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[contact_message.email],
        fail_silently=False,
    )
