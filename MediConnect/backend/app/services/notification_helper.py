"""Notification helper for creating notifications from business operations."""

import logging
from app.services.notification_service import NotificationService
from app.models.base import NotificationType

logger = logging.getLogger(__name__)


async def _send_push_notification(recipient_id: str, title: str, body: str, data: dict | None = None) -> None:
    try:
        from app.services.push_notification_service import PushNotificationService
        await PushNotificationService.send_to_user(recipient_id, title, body, data or {})
    except Exception as e:
        logger.debug("Push notification skipped: %s", e)


async def notify_post_commented(post_author_id: str, commenter_id: str, post_id: str) -> None:
    if post_author_id == commenter_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=post_author_id,
            sender_id=commenter_id,
            notification_type=NotificationType.COMMENT,
            title="New Comment",
            message="Someone commented on your post",
            reference_id=post_id,
            reference_type="post",
        )
    except Exception as e:
        logger.warning("Failed to create comment notification: %s", e)
    await _send_push_notification(post_author_id, "New Comment", "Someone commented on your post", {"post_id": post_id})


async def notify_post_reacted(post_author_id: str, reactor_id: str, post_id: str) -> None:
    if post_author_id == reactor_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=post_author_id,
            sender_id=reactor_id,
            notification_type=NotificationType.POST_REACTION,
            title="New Reaction",
            message="Someone reacted to your post",
            reference_id=post_id,
            reference_type="post",
        )
    except Exception as e:
        logger.warning("Failed to create reaction notification: %s", e)


async def notify_post_shared(post_author_id: str, sharer_id: str, post_id: str) -> None:
    if post_author_id == sharer_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=post_author_id,
            sender_id=sharer_id,
            notification_type=NotificationType.POST_REACTION,
            title="Post Shared",
            message="Someone shared your post",
            reference_id=post_id,
            reference_type="post",
        )
    except Exception as e:
        logger.warning("Failed to create share notification: %s", e)


async def notify_comment_replied(parent_author_id: str, replier_id: str, post_id: str) -> None:
    if parent_author_id == replier_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=parent_author_id,
            sender_id=replier_id,
            notification_type=NotificationType.REPLY,
            title="New Reply",
            message="Someone replied to your comment",
            reference_id=post_id,
            reference_type="post",
        )
    except Exception as e:
        logger.warning("Failed to create reply notification: %s", e)


async def notify_followed(target_user_id: str, follower_id: str) -> None:
    if target_user_id == follower_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=target_user_id,
            sender_id=follower_id,
            notification_type=NotificationType.FOLLOWER,
            title="New Follower",
            message="Someone started following you",
            reference_id=follower_id,
            reference_type="user",
        )
    except Exception as e:
        logger.warning("Failed to create follow notification: %s", e)


async def clear_connection_request_notifications(receiver_id: str, requester_id: str) -> None:
    try:
        from app.models.notification import Notification
        existing = await Notification.find(
            Notification.recipient_id == receiver_id,
            Notification.sender_id == requester_id,
            Notification.notification_type == NotificationType.CONNECTION_REQUEST,
        ).to_list()
        for notif in existing:
            await notif.delete()
    except Exception as e:
        logger.warning("Failed to clear connection request notifications: %s", e)


async def notify_connection_request(receiver_id: str, requester_id: str) -> None:
    try:
        await clear_connection_request_notifications(receiver_id, requester_id)
        await NotificationService.create_notification(
            recipient_id=receiver_id,
            sender_id=requester_id,
            notification_type=NotificationType.CONNECTION_REQUEST,
            title="Connection Request",
            message="sent you a connection request",
            reference_id=requester_id,
            reference_type="connection",
        )
    except Exception as e:
        logger.warning("Failed to create connection request notification: %s", e)
    await _send_push_notification(receiver_id, "Connection Request", "You have a new connection request")


async def notify_connection_accepted(requester_id: str, accepter_id: str) -> None:
    try:
        from app.models.notification import Notification
        existing = await Notification.find(
            Notification.recipient_id == requester_id,
            Notification.sender_id == accepter_id,
            Notification.notification_type == NotificationType.CONNECTION_ACCEPTED,
        ).to_list()
        for notif in existing:
            await notif.delete()
        await NotificationService.create_notification(
            recipient_id=requester_id,
            sender_id=accepter_id,
            notification_type=NotificationType.CONNECTION_ACCEPTED,
            title="Connection Accepted",
            message="Your connection request was accepted",
            reference_id=accepter_id,
            reference_type="connection",
        )
    except Exception as e:
        logger.warning("Failed to create connection accepted notification: %s", e)
    await _send_push_notification(requester_id, "Connection Accepted", "Your connection request was accepted")


async def notify_job_posted(job_id: str, title: str) -> None:
    try:
        from app.models.user import User
        users = await User.find(
            User.notification_settings.jobs == True,
            User.account_status == "verified",
        ).to_list()
        for user in users:
            await NotificationService.create_notification(
                recipient_id=user.user_id,
                sender_id=None,
                notification_type=NotificationType.JOB_RECOMMENDATION,
                title="New Job Posted",
                message=f"New job: {title}",
                reference_id=job_id,
                reference_type="job",
            )
    except Exception as e:
        logger.warning("Failed to create job notification: %s", e)


async def resolve_posting_recipients(
    recruiter_id: str | None,
    organization_id: str | None,
    exclude_user_id: str | None = None,
) -> list[str]:
    """Who should hear about a new application: the recruiter plus the
    organization's owner and active admin/recruiter members."""
    recipients: list[str] = []

    if recruiter_id:
        recipients.append(recruiter_id)

    if organization_id:
        try:
            from app.models.organization import Organization
            from app.models.organization_members import OrganizationMember
            from app.models.base import OrganizationMemberStatus

            org = await Organization.find_one(Organization.organization_id == organization_id)
            if org and org.owner_id:
                recipients.append(org.owner_id)

            members = await OrganizationMember.find(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.status == OrganizationMemberStatus.ACTIVE,
            ).to_list()
            for m in members:
                if (m.organization_role or "").lower() in ("owner", "admin", "recruiter", "hr"):
                    recipients.append(m.user_id)
        except Exception as e:
            logger.warning("Failed to resolve organization recipients: %s", e)

    seen: set[str] = set()
    return [
        r for r in recipients
        if r and r != exclude_user_id and not (r in seen or seen.add(r))
    ]


async def _applicant_name(applicant_id: str) -> str | None:
    try:
        from app.models.user import User
        user = await User.find_one(User.user_id == applicant_id)
        if not user:
            return None
        name = " ".join(
            p for p in (user.first_name, user.middle_name, user.last_name) if p
        ).strip()
        return name or user.username
    except Exception as e:
        logger.warning("Failed to resolve applicant name: %s", e)
        return None


async def notify_application_received(
    recipient_id: str,
    job_id: str,
    job_title: str,
    applicant_id: str,
    applicant_name: str | None = None,
) -> None:
    """Tell the poster/organization that a new application arrived."""
    try:
        who = applicant_name or "Someone"
        await NotificationService.create_notification(
            recipient_id=recipient_id,
            sender_id=applicant_id,
            notification_type=NotificationType.JOB_RECOMMENDATION,
            title="New job application",
            message=f"{who} applied to {job_title}",
            reference_id=job_id,
            reference_type="job",
        )
    except Exception as e:
        logger.warning("Failed to create new-application notification: %s", e)
    await _send_push_notification(
        recipient_id,
        "New job application",
        f"{applicant_name or 'Someone'} applied to {job_title}",
    )


async def notify_internship_application_received(
    recipient_id: str,
    internship_id: str,
    internship_title: str,
    applicant_id: str,
    applicant_name: str | None = None,
) -> None:
    try:
        who = applicant_name or "Someone"
        await NotificationService.create_notification(
            recipient_id=recipient_id,
            sender_id=applicant_id,
            notification_type=NotificationType.INTERNSHIP_RECOMMENDATION,
            title="New internship application",
            message=f"{who} applied to {internship_title}",
            reference_id=internship_id,
            reference_type="internship",
        )
    except Exception as e:
        logger.warning("Failed to create new internship application notification: %s", e)
    await _send_push_notification(
        recipient_id,
        "New internship application",
        f"{applicant_name or 'Someone'} applied to {internship_title}",
    )


async def notify_internship_application_update(applicant_id: str, internship_id: str, new_status: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=applicant_id,
            sender_id=None,
            notification_type=NotificationType.INTERNSHIP_RECOMMENDATION,
            title="Internship application update",
            message=f"Your internship application status changed to: {new_status}",
            reference_id=internship_id,
            reference_type="internship",
        )
    except Exception as e:
        logger.warning("Failed to create internship application update notification: %s", e)
    await _send_push_notification(
        applicant_id,
        "Internship application update",
        f"Your internship application status changed to: {new_status}",
    )


async def notify_event_registration_received(
    recipient_id: str,
    event_id: str,
    event_title: str,
    attendee_id: str,
    attendee_name: str | None = None,
) -> None:
    try:
        who = attendee_name or "Someone"
        await NotificationService.create_notification(
            recipient_id=recipient_id,
            sender_id=attendee_id,
            notification_type=NotificationType.EVENT_REMINDER,
            title="New event registration",
            message=f"{who} registered for {event_title}",
            reference_id=event_id,
            reference_type="event",
        )
    except Exception as e:
        logger.warning("Failed to create new event registration notification: %s", e)
    await _send_push_notification(
        recipient_id,
        "New event registration",
        f"{attendee_name or 'Someone'} registered for {event_title}",
    )


async def notify_application_update(applicant_id: str, job_id: str, new_status: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=applicant_id,
            sender_id=None,
            notification_type=NotificationType.JOB_RECOMMENDATION,
            title="Application Update",
            message=f"Your application status changed to: {new_status}",
            reference_id=job_id,
            reference_type="job",
        )
    except Exception as e:
        logger.warning("Failed to create application update notification: %s", e)
    await _send_push_notification(applicant_id, "Application Update", f"Your application status changed to: {new_status}")


async def notify_event_registration_confirmed(user_id: str, event_id: str, event_title: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=user_id,
            sender_id=None,
            notification_type=NotificationType.EVENT_REMINDER,
            title="Registration Confirmed",
            message=f"You are registered for: {event_title}",
            reference_id=event_id,
            reference_type="event",
        )
    except Exception as e:
        logger.warning("Failed to create event registration notification: %s", e)


notify_event_registration = notify_event_registration_confirmed


async def notify_mentorship_request(mentor_id: str, mentee_id: str, request_id: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=mentor_id,
            sender_id=mentee_id,
            notification_type=NotificationType.MENTORSHIP_REQUEST,
            title="Mentorship Request",
            message="You have a new mentorship request",
            reference_id=request_id,
            reference_type="mentorship",
        )
    except Exception as e:
        logger.warning("Failed to create mentorship request notification: %s", e)
    await _send_push_notification(mentor_id, "Mentorship Request", "You have a new mentorship request")


async def notify_mentorship_accepted(mentee_id: str, mentor_id: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=mentee_id,
            sender_id=mentor_id,
            notification_type=NotificationType.MENTORSHIP_REQUEST,
            title="Mentorship Accepted",
            message="Your mentorship request was accepted",
            reference_id=mentor_id,
            reference_type="mentorship",
        )
    except Exception as e:
        logger.warning("Failed to create mentorship accepted notification: %s", e)


async def notify_message_received(recipient_id: str, sender_id: str, conversation_id: str) -> None:
    if recipient_id == sender_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=recipient_id,
            sender_id=sender_id,
            notification_type=NotificationType.NEW_MESSAGE,
            title="New Message",
            message="You have a new message",
            reference_id=conversation_id,
            reference_type="message",
        )
    except Exception as e:
        logger.warning("Failed to create message notification: %s", e)
    await _send_push_notification(recipient_id, "New Message", "You have a new message")


async def notify_mentioned(recipient_id: str, mentioner_id: str, reference_id: str, reference_type: str) -> None:
    if recipient_id == mentioner_id:
        return
    try:
        await NotificationService.create_notification(
            recipient_id=recipient_id,
            sender_id=mentioner_id,
            notification_type=NotificationType.MENTION,
            title="You were mentioned",
            message="Someone mentioned you",
            reference_id=reference_id,
            reference_type=reference_type,
        )
    except Exception as e:
        logger.warning("Failed to create mention notification: %s", e)


async def notify_announcement(user_id: str, announcement_id: str, title: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=user_id,
            sender_id=None,
            notification_type=NotificationType.ADMIN_ANNOUNCEMENT,
            title="Announcement",
            message=title,
            reference_id=announcement_id,
            reference_type="announcement",
        )
    except Exception as e:
        logger.warning("Failed to create announcement notification: %s", e)


async def notify_verification_update(user_id: str, new_status: str) -> None:
    try:
        await NotificationService.create_notification(
            recipient_id=user_id,
            sender_id=None,
            notification_type=NotificationType.VERIFICATION_UPDATE,
            title="Verification Update",
            message=f"Your verification status: {new_status}",
            reference_id=user_id,
            reference_type="user",
        )
    except Exception as e:
        logger.warning("Failed to create verification notification: %s", e)
