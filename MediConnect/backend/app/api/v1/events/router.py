from fastapi import APIRouter, Depends, Query, status
from app.schemas.event import EventCreateRequest, EventUpdateRequest
from app.services.event_service import EventService
from app.core.dependencies import get_current_user_id, get_optional_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(body: EventCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await EventService.create_event(user_id, body)
    return success_response(result["message"], {"event_id": result["event_id"]})


@router.get("")
async def get_events(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    user_id: str | None = Depends(get_optional_user_id),
):
    result = await EventService.get_events(page, per_page, user_id, status)
    return success_response("Events retrieved", result)


@router.get("/upcoming")
async def get_upcoming_events(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Depends(get_optional_user_id),
):
    result = await EventService.get_events(page, per_page, user_id)
    return success_response("Upcoming events retrieved", result)


@router.get("/my-organized")
async def get_my_organized_events(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await EventService.get_user_organized_events(user_id, page)
    return success_response("Organized events retrieved", result)


@router.get("/my-registrations")
async def get_my_registrations(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await EventService.get_user_registrations(user_id, page)
    return success_response("Registrations retrieved", result)


@router.get("/my-events")
async def get_my_events(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await EventService.get_user_organized_events(user_id, page)
    return success_response("Organized events retrieved", result)


@router.get("/registered")
async def get_registered_events(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await EventService.get_user_registrations(user_id, page)
    return success_response("Registered events retrieved", result)


@router.get("/registrations")
async def get_all_registrations(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    attendance_status: str | None = Query(default=None),
):
    result = await EventService.get_organized_registrations(user_id, page, attendance_status=attendance_status)
    return success_response("Registrations retrieved", result)


@router.get("/saved")
async def get_saved_events(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await EventService.get_saved_events(user_id, page, per_page)
    return success_response("Saved events retrieved", result)


@router.get("/{event_id}")
async def get_event(event_id: str, user_id: str | None = Depends(get_optional_user_id)):
    result = await EventService.get_event(event_id, user_id)
    return success_response("Event retrieved", result)


@router.patch("/{event_id}")
async def update_event(event_id: str, body: EventUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await EventService.update_event(event_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{event_id}")
async def delete_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.delete_event(event_id, user_id)
    return success_response(result["message"])


@router.post("/{event_id}/register", status_code=status.HTTP_201_CREATED)
async def register_for_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.register_for_event(event_id, user_id)
    return success_response(result["message"], {"registration_id": result["registration_id"]})


@router.delete("/{event_id}/register")
async def cancel_registration(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.cancel_registration(event_id, user_id)
    return success_response(result["message"])


@router.post("/{event_id}/save", status_code=status.HTTP_201_CREATED)
async def save_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.save_event(event_id, user_id)
    return success_response(result["message"])


@router.delete("/{event_id}/save")
async def unsave_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.unsave_event(event_id, user_id)
    return success_response(result["message"])


@router.delete("/{event_id}/cancel")
async def cancel_registration_v2(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.cancel_registration(event_id, user_id)
    return success_response(result["message"])


@router.get("/{event_id}/registrations")
async def get_event_registrations(event_id: str, user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await EventService.get_event_registrations(event_id, user_id, page)
    return success_response("Registrations retrieved", result)


@router.delete("/{event_id}/cancel-registration")
async def cancel_registration_by_path(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = await EventService.cancel_registration(event_id, user_id)
    return success_response(result["message"])


@router.patch("/{event_id}/attendance")
async def mark_attendance(
    event_id: str,
    user_id: str = Depends(get_current_user_id),
    attendance_status: str = Query(default="present"),
    target_user_id: str | None = Query(default=None),
):
    result = await EventService.mark_attendance(event_id, user_id, attendance_status, target_user_id)
    return success_response(result["message"], result)
