from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from app.schemas.post import PostCreateRequest, PostUpdateRequest, CommentCreateRequest, ReactionRequest, ReportRequest
from app.services.post_service import PostService
from app.core.dependencies import get_current_user_id, get_optional_user_id
from app.core.exceptions import success_response, NotFoundError, AuthorizationError

router = APIRouter(prefix="/posts", tags=["Posts"])

comments_router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_post(body: PostCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.create_post(user_id, body)
    return success_response(result["message"], {"post_id": result["post_id"]})


@router.get("/feed")
async def get_feed(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    feed_type: str = Query(default="home"),
    organization: str | None = Query(default=None),
):
    result = await PostService.get_feed(user_id, page, per_page, cursor=cursor, limit=limit, feed_type=feed_type, organization=organization)
    return success_response("Feed retrieved", result)


@router.get("/feed/ranked")
async def get_feed_ranked(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await PostService.get_feed_ranked(user_id, page, per_page)
    return success_response("Ranked feed retrieved", result)


@router.get("/bookmarks")
async def get_bookmarks(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await PostService.get_user_bookmarks(user_id, page)
    return success_response("Bookmarks retrieved", result)


@router.get("/trending")
async def get_trending_posts(page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await PostService.get_trending_posts(page, per_page)
    return success_response("Trending posts retrieved", result)


@router.get("/{post_id}")
async def get_post(post_id: str, user_id: str | None = Depends(get_optional_user_id)):
    result = await PostService.get_post(post_id, user_id)
    return success_response("Post retrieved", result)


@router.patch("/{post_id}")
async def update_post(post_id: str, body: PostUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.update_post(post_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{post_id}")
async def delete_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.delete_post(post_id, user_id)
    return success_response(result["message"])


@router.post("/{post_id}/react")
async def react_to_post(post_id: str, body: ReactionRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.react_to_post(post_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{post_id}/react")
async def remove_reaction(post_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.remove_reaction(post_id, user_id)
    return success_response(result["message"])


@router.post("/{post_id}/bookmark")
async def bookmark_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.bookmark_post(post_id, user_id)
    return success_response(result["message"])


@router.delete("/{post_id}/bookmark")
async def remove_bookmark(post_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.remove_bookmark(post_id, user_id)
    return success_response(result["message"])


@router.post("/{post_id}/share")
async def share_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.share_post(post_id, user_id)
    return success_response(result["message"])


@router.post("/{post_id}/report")
async def report_post(post_id: str, body: ReportRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.report_post(user_id, post_id, body)
    return success_response(result["message"])


@router.get("/{post_id}/comments")
async def get_comments(
    post_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Depends(get_optional_user_id),
):
    result = await PostService.get_comments(post_id, page, per_page, user_id)
    return success_response("Comments retrieved", result)


@router.post("/{post_id}/comments/{comment_id}/like")
async def like_comment(post_id: str, comment_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.toggle_comment_reaction(comment_id, user_id)
    return success_response(result["message"], result)


@router.post("/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(post_id: str, body: CommentCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.add_comment(post_id, user_id, body)
    return success_response(result["message"], {"comment_id": result["comment_id"]})


@router.patch("/comments/{comment_id}")
async def update_comment(comment_id: str, body: CommentCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.update_comment(comment_id, user_id, body)
    return success_response(result["message"])


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.delete_comment(comment_id, user_id)
    return success_response(result["message"])


@router.patch("/{post_id}/comments/{comment_id}")
async def update_comment_v2(post_id: str, comment_id: str, body: CommentCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.update_comment(comment_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{post_id}/comments/{comment_id}")
async def delete_comment_v2(post_id: str, comment_id: str, body: CommentCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.delete_comment(comment_id, user_id)
    return success_response(result["message"])


@comments_router.patch("/{comment_id}")
async def update_comment_standalone(comment_id: str, body: CommentCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await PostService.update_comment(comment_id, user_id, body)
    return success_response(result["message"])


@comments_router.delete("/{comment_id}")
async def delete_comment_standalone(comment_id: str, user_id: str = Depends(get_current_user_id)):
    result = await PostService.delete_comment(comment_id, user_id)
    return success_response(result["message"])


@router.post("/{post_id}/media")
async def upload_post_media(
    post_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    from app.storage.cloudinary_service import CloudinaryService
    from app.models.post import Post
    post = await Post.find_one(Post.post_id == post_id)
    if not post:
        raise NotFoundError("Post not found")
    if post.author_id != user_id:
        raise AuthorizationError("Not authorized")
    media_type = "image"
    if file.content_type and file.content_type.startswith("video/"):
        url = await CloudinaryService.upload_video(file, folder=f"posts/{post_id}")
        media_type = "video"
    else:
        url = await CloudinaryService.upload_image(file, folder=f"posts/{post_id}")
    post.media.append({"type": media_type, "url": url})
    await post.save()
    return success_response("Media uploaded", {"url": url, "type": media_type})


@router.delete("/{post_id}/media/{media_index}")
async def delete_post_media(
    post_id: str,
    media_index: int,
    user_id: str = Depends(get_current_user_id),
):
    from app.models.post import Post
    from app.storage.cloudinary_service import CloudinaryService
    post = await Post.find_one(Post.post_id == post_id)
    if not post:
        raise NotFoundError("Post not found")
    if post.author_id != user_id:
        raise AuthorizationError("Not authorized")
    if media_index < 0 or media_index >= len(post.media):
        raise NotFoundError("Media not found")
    removed = post.media.pop(media_index)
    if removed.get("url"):
        public_id = removed["url"].split("/")[-1].split(".")[0]
        CloudinaryService.delete_file(f"mediconnect/posts/{post_id}/{public_id}")
    await post.save()
    return success_response("Media deleted")


@router.post("/{post_id}/pin")
async def pin_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    from app.models.post import Post
    post = await Post.find_one(Post.post_id == post_id)
    if not post:
        raise NotFoundError("Post not found")
    if post.author_id != user_id:
        raise AuthorizationError("Not authorized")
    post.is_pinned = not post.is_pinned
    await post.save()
    return success_response("Post pinned" if post.is_pinned else "Post unpinned")
