from fastapi import APIRouter, Depends, Query, status
from app.schemas.mentorship import (
    MentorshipRequestCreate, MentorshipRequestUpdate,
    MentorshipUpdateRequest, MentorshipSessionRequest, MentorshipSessionUpdate,
    MentorshipSessionFeedback, MentorProfileUpdate,
)
from app.services.mentorship_service import MentorshipService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/mentorship", tags=["Mentorship"])


@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def send_request(body: MentorshipRequestCreate, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.send_request(user_id, body)
    return success_response(result["message"], {"request_id": result["request_id"]})


@router.patch("/requests/{request_id}")
async def respond_to_request(request_id: str, body: MentorshipRequestUpdate, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.respond_to_request(request_id, user_id, body)
    return success_response(result["message"])


@router.get("/requests/sent")
async def get_my_sent_requests(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await MentorshipService.get_mentee_requests(user_id, page)
    return success_response("Sent requests retrieved", result)


@router.get("/requests/received")
async def get_my_received_requests(user_id: str = Depends(get_current_user_id), status: str = Query(default="pending"), page: int = Query(default=1, ge=1)):
    result = await MentorshipService.get_mentor_requests(user_id, status, page)
    return success_response("Received requests retrieved", result)


@router.get("/available-mentors")
async def get_available_mentors(page: int = Query(default=1, ge=1)):
    result = await MentorshipService.get_available_mentors(page)
    return success_response("Available mentors retrieved", result)


@router.get("/status")
async def get_mentor_status(user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.get_mentor_status(user_id)
    return success_response("Mentor status retrieved", result)


@router.post("/apply")
async def apply_as_mentor(user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.become_mentor(user_id)
    return success_response(result["message"])


@router.post("/opt-out")
async def opt_out(user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.opt_out(user_id)
    return success_response(result["message"])


@router.get("/dashboard")
async def get_mentor_dashboard(user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.get_mentor_dashboard(user_id)
    return success_response("Mentor dashboard retrieved", result)


@router.get("/my-mentorships")
async def get_my_mentorships(user_id: str = Depends(get_current_user_id), role: str = Query(default="mentee"), page: int = Query(default=1, ge=1)):
    result = await MentorshipService.get_user_mentorships(user_id, role, page)
    return success_response("Mentorships retrieved", result)


@router.get("/{mentorship_id}/sessions")
async def get_mentorship_sessions(mentorship_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.get_mentorship_sessions(mentorship_id, user_id)
    return success_response("Sessions retrieved", result)


@router.get("/{mentorship_id}")
async def get_mentorship(mentorship_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.get_mentorship(mentorship_id, user_id)
    return success_response("Mentorship retrieved", result)


@router.patch("/{mentorship_id}")
async def update_mentorship(mentorship_id: str, body: MentorshipUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.update_mentorship(mentorship_id, user_id, body)
    return success_response(result["message"])


@router.post("/{mentorship_id}/sessions", status_code=status.HTTP_201_CREATED)
async def add_session(mentorship_id: str, body: MentorshipSessionRequest, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.add_session(mentorship_id, user_id, body)
    return success_response(result["message"], {"session_id": result["session_id"]})


@router.patch("/{mentorship_id}/sessions/{session_id}")
async def update_session(mentorship_id: str, session_id: str, body: MentorshipSessionUpdate, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.update_session(mentorship_id, session_id, user_id, body)
    return success_response(result["message"])


router2 = APIRouter(prefix="/mentors", tags=["Mentors"])


@router2.post("", status_code=status.HTTP_201_CREATED)
async def become_mentor(user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.become_mentor(user_id)
    return success_response(result["message"])


@router2.get("")
async def list_mentors(page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await MentorshipService.get_available_mentors(page, per_page)
    return success_response("Mentors retrieved", result)


@router.post("/request", status_code=status.HTTP_201_CREATED)
async def send_request_v2(body: MentorshipRequestCreate, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.send_request(user_id, body)
    return success_response(result["message"], {"request_id": result["request_id"]})


@router.patch("/request/{request_id}")
async def respond_to_request_v2(request_id: str, body: MentorshipRequestUpdate, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.respond_to_request(request_id, user_id, body)
    return success_response(result["message"])


@router.post("/session", status_code=status.HTTP_201_CREATED)
async def add_session_v2(body: MentorshipSessionRequest, user_id: str = Depends(get_current_user_id)):
    mentorship_id = body.mentorship_id if hasattr(body, 'mentorship_id') else ""
    if not mentorship_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="mentorship_id required in body")
    result = await MentorshipService.add_session(mentorship_id, user_id, body)
    return success_response(result["message"], {"session_id": result["session_id"]})


@router.patch("/session/{session_id}")
async def update_session_v2(session_id: str, body: MentorshipSessionUpdate, user_id: str = Depends(get_current_user_id)):
    mentorship_id = body.mentorship_id if hasattr(body, 'mentorship_id') else ""
    if not mentorship_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="mentorship_id required in body")
    result = await MentorshipService.update_session(mentorship_id, session_id, user_id, body)
    return success_response(result["message"])


@router2.get("/{mentor_id}")
async def get_mentor(mentor_id: str):
    result = await MentorshipService.get_mentor(mentor_id)
    return success_response("Mentor retrieved", result)


@router2.patch("/{mentor_id}")
async def update_mentor(mentor_id: str, body: MentorProfileUpdate, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.update_mentor(mentor_id, user_id, body)
    return success_response(result["message"])


@router2.delete("/{mentor_id}")
async def delete_mentor(mentor_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.delete_mentor(mentor_id, user_id)
    return success_response(result["message"])


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.get_session(session_id, user_id)
    return success_response("Session retrieved", result)


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.delete_session(session_id, user_id)
    return success_response(result["message"])


@router.post("/sessions/{session_id}/feedback", status_code=status.HTTP_201_CREATED)
async def session_feedback(session_id: str, body: MentorshipSessionFeedback, user_id: str = Depends(get_current_user_id)):
    result = await MentorshipService.session_feedback(session_id, user_id, body)
    return success_response(result["message"])
