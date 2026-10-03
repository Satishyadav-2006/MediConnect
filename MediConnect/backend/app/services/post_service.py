import logging
import secrets
from datetime import datetime, timezone
from typing import Any
from app.models.post import Post, Reaction, Bookmark, MediaItem
from app.models.comment import Comment, CommentReaction
from app.models.connection import Follow, Connection, ConnectionStatus
from app.models.report import Report
from app.models.organization import Organization
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.post import PostCreateRequest, PostUpdateRequest, CommentCreateRequest, ReactionRequest, ReportRequest
from app.utils.validators import extract_hashtags, extract_mentions, sanitize_string
from app.utils.pagination import paginate_response
from app.models.base import PostType, Visibility, ReactionType, VerificationStatus
from app.services.notification_helper import (
    notify_post_commented, notify_post_reacted, notify_post_shared,
    notify_comment_replied,
)
from beanie.odm.operators.find.comparison import In
from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)


class PostService:

    @staticmethod
    async def _with_authors(posts: list[Post], viewer_id: str | None = None) -> list[dict[str, Any]]:
        if not posts:
            return []
        ids = [p.author_id for p in posts if p.author_id]
        users = await User.find(In(User.user_id, ids)).to_list() if ids else []
        user_map = {u.user_id: u for u in users}

        liked: set[str] = set()
        saved: set[str] = set()
        if viewer_id:
            post_ids = [p.post_id for p in posts]
            liked = {r.post_id for r in await Reaction.find(
                In(Reaction.post_id, post_ids), Reaction.user_id == viewer_id
            ).to_list()}
            saved = {b.post_id for b in await Bookmark.find(
                In(Bookmark.post_id, post_ids), Bookmark.user_id == viewer_id
            ).to_list()}

        result: list[dict[str, Any]] = []
        for p in posts:
            d = p.model_dump(mode="json")
            d["_id"] = d["post_id"]
            u = user_map.get(p.author_id)
            d["author"] = {
                "_id": u.user_id if u else None,
                "fullName": f"{u.first_name} {u.last_name}".strip() if u else "",
                "username": u.username if u else "",
                "profilePhoto": u.profile_photo if u else None,
                "headline": u.headline if u else None,
                "isVerified": u.verification_status == VerificationStatus.APPROVED if u else False,
            }
            d["isLiked"] = p.post_id in liked
            d["isSaved"] = p.post_id in saved
            d["likesCount"] = p.reaction_count
            d["commentsCount"] = p.comment_count
            d["sharesCount"] = p.share_count
            result.append(d)
        return result

    @staticmethod
    async def create_post(author_id: str, data: PostCreateRequest) -> dict[str, Any]:
        post_id = secrets.token_hex(16)
        hashtags = data.hashtags or extract_hashtags(data.content)
        mentions = data.mentions or extract_mentions(data.content)
        content = sanitize_string(data.content)

        post = Post(
            post_id=post_id,
            author_id=author_id,
            organization_id=data.organization_id,
            post_type=PostType(data.post_type) if data.post_type in [e.value for e in PostType] else PostType.TEXT,
            content=content,
            media=[MediaItem(**m) for m in data.media] if data.media else [],
            hashtags=hashtags,
            mentions=mentions,
            visibility=Visibility(data.visibility) if data.visibility in [e.value for e in Visibility] else Visibility.PUBLIC,
            location=data.location,
        )
        await post.insert()
        return {"post_id": post.post_id, "message": "Post created successfully"}

    @staticmethod
    async def _connection_user_ids(user_id: str) -> list[str]:
        peer_ids: set[str] = set()
        sent = await Connection.find(
            Connection.sender_id == user_id,
            Connection.status == ConnectionStatus.ACCEPTED,
        ).to_list()
        received = await Connection.find(
            Connection.receiver_id == user_id,
            Connection.status == ConnectionStatus.ACCEPTED,
        ).to_list()
        for c in sent:
            peer_ids.add(c.receiver_id)
        for c in received:
            peer_ids.add(c.sender_id)
        follows = await Follow.find(
            Follow.follower_id == user_id,
            Follow.following_type == "user",
        ).to_list()
        for f in follows:
            peer_ids.add(f.following_id)
        return list(peer_ids)

    @staticmethod
    async def _approved_organization_ids() -> list[str]:
        orgs = await Organization.find(
            Organization.verification_status == VerificationStatus.APPROVED,
            Organization.is_deleted == False,
        ).to_list()
        return [o.organization_id for o in orgs]

    @staticmethod
    async def get_feed(
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        cursor: str | None = None,
        limit: int = 20,
        feed_type: str = "home",
        organization: str | None = None,
    ) -> dict[str, Any]:
        feed_type = (feed_type or "home").lower()
        if feed_type == "trending":
            return await PostService.get_feed_ranked(user_id, page, per_page)

        if feed_type == "connections":
            peer_ids = await PostService._connection_user_ids(user_id)
            if not peer_ids:
                return paginate_response([], 0, page, per_page, "created_at")
            filters = [
                Post.is_deleted == False,
                In(Post.visibility, [Visibility.PUBLIC, Visibility.CONNECTIONS]),
                In(Post.author_id, peer_ids),
            ]
        elif feed_type == "organizations":
            org_ids = await PostService._approved_organization_ids()
            if not org_ids:
                return paginate_response([], 0, page, per_page, "created_at")
            filters = [
                Post.is_deleted == False,
                Post.visibility == Visibility.PUBLIC,
                In(Post.organization_id, org_ids),
            ]
        elif feed_type == "research":
            filters = [
                Post.is_deleted == False,
                Post.visibility == Visibility.PUBLIC,
                Post.post_type == PostType.RESEARCH,
            ]
        else:
            filters = [
                Post.is_deleted == False,
                Post.visibility == Visibility.PUBLIC,
            ]
            if organization:
                filters.append(Post.organization_id == organization)

        skip = (page - 1) * per_page
        posts = await Post.find(*filters).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Post.find(*filters).count()
        return paginate_response(await PostService._with_authors(posts, user_id), total, page, per_page, "created_at")

    @staticmethod
    async def get_feed_ranked(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from datetime import timedelta
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        recent_cutoff = now - timedelta(days=7)
        skip = (page - 1) * per_page

        posts = await Post.find(
            Post.is_deleted == False,
            Post.visibility == Visibility.PUBLIC,
            Post.created_at >= recent_cutoff,
        ).sort("-created_at").skip(skip).limit(per_page * 3).to_list()

        if len(posts) < per_page:
            older_posts = await Post.find(
                Post.is_deleted == False,
                Post.visibility == Visibility.PUBLIC,
                Post.created_at < recent_cutoff,
            ).sort("-created_at").limit(per_page * 2).to_list()
            posts.extend(older_posts)

        def score_post(p: Post) -> float:
            created = p.created_at
            if created.tzinfo is not None:
                created = created.astimezone(timezone.utc).replace(tzinfo=None)
            hours_old = max(1, (now - created).total_seconds() / 3600)
            recency_score = 1.0 / (hours_old ** 0.5)
            engagement = (p.reaction_count * 3) + (p.comment_count * 4) + (p.share_count * 5) + (p.view_count * 0.1)
            engagement_score = min(engagement / 10.0, 10.0)
            has_media = 1.0 if p.media else 0.0
            return recency_score + engagement_score + has_media

        posts.sort(key=score_post, reverse=True)
        ranked = posts[:per_page]
        total = await Post.find(Post.is_deleted == False, Post.visibility == Visibility.PUBLIC).count()
        return paginate_response(await PostService._with_authors(ranked, user_id), total, page, per_page, "created_at")

    @staticmethod
    async def get_trending_posts(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        filters = [
            Post.is_deleted == False,
            Post.visibility == Visibility.PUBLIC,
        ]
        skip = (page - 1) * per_page
        posts = await Post.find(*filters).sort("-reaction_count").skip(skip).limit(per_page).to_list()
        total = await Post.find(*filters).count()
        return paginate_response(await PostService._with_authors(posts), total, page, per_page, "reaction_count")

    @staticmethod
    async def get_user_posts(user_id: str, page: int = 1, per_page: int = 20, viewer_id: str | None = None) -> dict[str, Any]:
        from app.repositories.post_repository import PostRepository
        skip = (page - 1) * per_page
        posts = await PostRepository.get_user_posts(user_id, page, per_page)
        total = await PostRepository.count_by_author(user_id)
        return paginate_response(await PostService._with_authors(posts, viewer_id), total, page, per_page, "created_at")

    @staticmethod
    async def get_post(post_id: str, viewer_id: str | None = None) -> dict[str, Any]:
        post = await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)
        if not post:
            raise NotFoundError("Post not found")
        post.view_count += 1
        await post.save()
        return await PostService._post_to_dict(post, viewer_id)

    @staticmethod
    async def update_post(post_id: str, author_id: str, data: PostUpdateRequest) -> dict[str, str]:
        post = await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)
        if not post:
            raise NotFoundError("Post not found")
        if post.author_id != author_id:
            raise AuthorizationError("Only the author can edit this post")
        if data.content is not None:
            post.content = sanitize_string(data.content)
            post.hashtags = extract_hashtags(data.content)
            post.mentions = extract_mentions(data.content)
        if data.visibility is not None:
            post.visibility = Visibility(data.visibility) if data.visibility in [e.value for e in Visibility] else post.visibility
        if data.hashtags is not None:
            post.hashtags = data.hashtags
        post.is_edited = True
        post.updated_at = datetime.now(timezone.utc)
        await post.save()
        return {"message": "Post updated successfully"}

    @staticmethod
    async def delete_post(post_id: str, author_id: str) -> dict[str, str]:
        post = await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)
        if not post:
            raise NotFoundError("Post not found")
        if post.author_id != author_id:
            raise AuthorizationError("Only the author can delete this post")
        post.is_deleted = True
        post.updated_at = datetime.now(timezone.utc)
        await post.save()
        return {"message": "Post deleted successfully"}

    @staticmethod
    async def react_to_post(post_id: str, user_id: str, data: ReactionRequest) -> dict[str, str]:
        post = await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)
        if not post:
            raise NotFoundError("Post not found")
        existing = await Reaction.find_one(
            Reaction.user_id == user_id,
            Reaction.post_id == post_id,
        )
        if existing:
            existing.reaction_type = ReactionType(data.reaction_type) if data.reaction_type in [e.value for e in ReactionType] else ReactionType.LIKE
            await existing.save()
            return {"message": "Reaction updated"}
        reaction = Reaction(
            user_id=user_id,
            post_id=post_id,
            reaction_type=ReactionType(data.reaction_type) if data.reaction_type in [e.value for e in ReactionType] else ReactionType.LIKE,
        )
        try:
            await reaction.insert()
        except DuplicateKeyError:
            return {"message": "Reaction already exists"}
        post.reaction_count += 1
        await post.save()
        await notify_post_reacted(post.author_id, user_id, post_id)
        return {"message": "Reaction added"}

    @staticmethod
    async def remove_reaction(post_id: str, user_id: str) -> dict[str, str]:
        reaction = await Reaction.find_one(
            Reaction.user_id == user_id,
            Reaction.post_id == post_id,
        )
        if not reaction:
            raise NotFoundError("Reaction not found")
        await reaction.delete()
        post = await Post.find_one(Post.post_id == post_id)
        if post:
            post.reaction_count = max(0, post.reaction_count - 1)
            await post.save()
        return {"message": "Reaction removed"}

    @staticmethod
    async def bookmark_post(post_id: str, user_id: str) -> dict[str, str]:
        existing = await Bookmark.find_one(Bookmark.user_id == user_id, Bookmark.post_id == post_id)
        if existing:
            return {"message": "Post already bookmarked"}
        bookmark = Bookmark(user_id=user_id, post_id=post_id)
        await bookmark.insert()
        post = await Post.find_one(Post.post_id == post_id)
        if post:
            post.bookmark_count += 1
            await post.save()
        return {"message": "Post bookmarked"}

    @staticmethod
    async def remove_bookmark(post_id: str, user_id: str) -> dict[str, str]:
        bookmark = await Bookmark.find_one(Bookmark.user_id == user_id, Bookmark.post_id == post_id)
        if not bookmark:
            return {"message": "Bookmark already removed"}
        await bookmark.delete()
        post = await Post.find_one(Post.post_id == post_id)
        if post:
            post.bookmark_count = max(0, post.bookmark_count - 1)
            await post.save()
        return {"message": "Bookmark removed"}

    @staticmethod
    async def _comments_with_authors(comments: list[Comment], viewer_id: str | None = None) -> list[dict[str, Any]]:
        if not comments:
            return []
        ids = [c.author_id for c in comments if c.author_id]
        users = await User.find(In(User.user_id, ids)).to_list() if ids else []
        user_map = {u.user_id: u for u in users}

        liked: set[str] = set()
        if viewer_id:
            cids = [c.comment_id for c in comments]
            liked = {r.comment_id for r in await CommentReaction.find(
                In(CommentReaction.comment_id, cids), CommentReaction.user_id == viewer_id
            ).to_list()}

        result: list[dict[str, Any]] = []
        for c in comments:
            u = user_map.get(c.author_id)
            result.append({
                "_id": c.comment_id,
                "comment_id": c.comment_id,
                "post_id": c.post_id,
                "author_id": c.author_id,
                "parentComment": c.parent_comment_id,
                "parent_comment_id": c.parent_comment_id,
                "content": c.content,
                "isLiked": c.comment_id in liked,
                "likesCount": c.reaction_count,
                "repliesCount": c.reply_count,
                "isEdited": c.is_edited,
                "createdAt": c.created_at,
                "created_at": c.created_at,
                "author": {
                    "_id": u.user_id if u else None,
                    "fullName": f"{u.first_name} {u.last_name}".strip() if u else "",
                    "username": u.username if u else "",
                    "profilePhoto": u.profile_photo if u else None,
                    "headline": u.headline if u else None,
                },
            })
        return result

    @staticmethod
    async def get_comments(post_id: str, page: int = 1, per_page: int = 20, viewer_id: str | None = None) -> dict[str, Any]:
        skip = (page - 1) * per_page
        top_level = await Comment.find(
            Comment.post_id == post_id,
            Comment.is_deleted == False,
            Comment.parent_comment_id == None,
        ).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Comment.find(
            Comment.post_id == post_id,
            Comment.is_deleted == False,
            Comment.parent_comment_id == None,
        ).count()
        top_ids = [c.comment_id for c in top_level]
        replies = await Comment.find(
            Comment.post_id == post_id,
            Comment.is_deleted == False,
            In(Comment.parent_comment_id, top_ids),
        ).sort("created_at").to_list() if top_ids else []
        dicts = await PostService._comments_with_authors(top_level + replies, viewer_id)
        reply_map: dict[str, list[dict[str, Any]]] = {}
        for d in dicts:
            if d["parentComment"]:
                reply_map.setdefault(d["parentComment"], []).append(d)
        for d in dicts:
            d["replies"] = reply_map.get(d["comment_id"], [])
        top_dicts = [d for d in dicts if not d["parentComment"]]
        return paginate_response(top_dicts, total, page, per_page, "created_at")

    @staticmethod
    async def toggle_comment_reaction(comment_id: str, user_id: str) -> dict[str, Any]:
        comment = await Comment.find_one(Comment.comment_id == comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
        existing = await CommentReaction.find_one(
            CommentReaction.comment_id == comment_id, CommentReaction.user_id == user_id
        )
        if existing:
            await existing.delete()
            comment.reaction_count = max(0, comment.reaction_count - 1)
            await comment.save()
            return {"isLiked": False, "likesCount": comment.reaction_count, "message": "Comment unliked"}
        try:
            await CommentReaction(comment_id=comment_id, user_id=user_id).insert()
        except DuplicateKeyError:
            return {"isLiked": True, "likesCount": comment.reaction_count, "message": "Comment already liked"}
        comment.reaction_count += 1
        await comment.save()
        return {"isLiked": True, "likesCount": comment.reaction_count, "message": "Comment liked"}

    @staticmethod
    async def add_comment(post_id: str, author_id: str, data: CommentCreateRequest) -> dict[str, Any]:
        post = await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)
        if not post:
            raise NotFoundError("Post not found")
        comment_id = secrets.token_hex(16)
        comment = Comment(
            comment_id=comment_id,
            post_id=post_id,
            author_id=author_id,
            parent_comment_id=data.parent_comment_id,
            content=sanitize_string(data.content),
            mentions=data.mentions or extract_mentions(data.content),
        )
        await comment.insert()
        post.comment_count += 1
        await post.save()
        if data.parent_comment_id:
            parent = await Comment.find_one(Comment.comment_id == data.parent_comment_id)
            if parent:
                parent.reply_count += 1
                await parent.save()
                await notify_comment_replied(parent.author_id, author_id, post_id)
        else:
            await notify_post_commented(post.author_id, author_id, post_id)
        return {"comment_id": comment.comment_id, "message": "Comment added"}

    @staticmethod
    async def update_comment(comment_id: str, user_id: str, data: CommentCreateRequest) -> dict[str, str]:
        comment = await Comment.find_one(Comment.comment_id == comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
        if comment.author_id != user_id:
            raise AuthorizationError("Only the author can edit this comment")
        comment.content = sanitize_string(data.content)
        comment.is_edited = True
        await comment.save()
        return {"message": "Comment updated"}

    @staticmethod
    async def delete_comment(comment_id: str, user_id: str) -> dict[str, str]:
        comment = await Comment.find_one(Comment.comment_id == comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
        if comment.author_id != user_id:
            raise AuthorizationError("Only the author can delete this comment")
        comment.is_deleted = True
        await comment.save()
        post = await Post.find_one(Post.post_id == comment.post_id)
        if post:
            post.comment_count = max(0, post.comment_count - 1)
            await post.save()
        return {"message": "Comment deleted"}

    @staticmethod
    async def share_post(post_id: str, user_id: str) -> dict[str, str]:
        post = await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)
        if not post:
            raise NotFoundError("Post not found")
        post.share_count += 1
        await post.save()
        await notify_post_shared(post.author_id, user_id, post_id)
        return {"message": "Post shared"}

    @staticmethod
    async def report_post(reporter_id: str, post_id: str, data: ReportRequest) -> dict[str, str]:
        post = await Post.find_one(Post.post_id == post_id)
        if not post:
            raise NotFoundError("Post not found")
        existing = await Report.find_one(
            Report.reporter_id == reporter_id,
            Report.target_id == post_id,
            Report.status == "pending",
        )
        if existing:
            raise ConflictError("You have already reported this post")
        report = Report(
            report_id=secrets.token_hex(16),
            reporter_id=reporter_id,
            target_id=post_id,
            resource_id=post_id,
            target_type="post",
            reason=data.reason,
            description=data.description,
        )
        await report.insert()
        return {"message": "Report submitted"}

    @staticmethod
    async def get_user_bookmarks(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        bookmarks = await Bookmark.find(Bookmark.user_id == user_id).skip(skip).limit(per_page).to_list()
        total = await Bookmark.find(Bookmark.user_id == user_id).count()
        post_ids = [b.post_id for b in bookmarks]
        posts = await Post.find(In(Post.post_id, post_ids), Post.is_deleted == False).to_list() if post_ids else []
        post_map = {p.post_id: p for p in posts}
        ordered = [post_map[b.post_id] for b in bookmarks if b.post_id in post_map]
        return paginate_response(await PostService._with_authors(ordered, user_id), total, page, per_page, "created_at")

    @staticmethod
    async def _post_to_dict(post: Post, viewer_id: str | None = None) -> dict[str, Any]:
        is_liked = False
        is_saved = False
        if viewer_id:
            is_liked = await Reaction.find_one(Reaction.user_id == viewer_id, Reaction.post_id == post.post_id) is not None
            is_saved = await Bookmark.find_one(Bookmark.user_id == viewer_id, Bookmark.post_id == post.post_id) is not None
        return {
            "_id": post.post_id,
            "post_id": post.post_id,
            "author_id": post.author_id,
            "organization_id": post.organization_id,
            "post_type": post.post_type.value if hasattr(post.post_type, 'value') else post.post_type,
            "content": post.content,
            "media": [{"cloudinary_url": m.cloudinary_url, "media_type": m.media_type} for m in post.media] if post.media else [],
            "hashtags": post.hashtags,
            "mentions": post.mentions,
            "visibility": post.visibility.value if hasattr(post.visibility, 'value') else post.visibility,
            "location": post.location,
            "is_edited": post.is_edited,
            "comment_count": post.comment_count,
            "reaction_count": post.reaction_count,
            "share_count": post.share_count,
            "bookmark_count": post.bookmark_count,
            "view_count": post.view_count,
            "likesCount": post.reaction_count,
            "commentsCount": post.comment_count,
            "sharesCount": post.share_count,
            "isLiked": is_liked,
            "isSaved": is_saved,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
        }
