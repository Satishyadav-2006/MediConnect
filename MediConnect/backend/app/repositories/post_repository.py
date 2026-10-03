import logging
from typing import Any

from app.models.post import Post

logger = logging.getLogger(__name__)


class PostRepository:

    @staticmethod
    async def find_by_id(post_id: str) -> Post | None:
        return await Post.find_one(Post.post_id == post_id, Post.is_deleted == False)

    @staticmethod
    async def create(post: Post) -> Post:
        await post.insert()
        return post

    @staticmethod
    async def update(post: Post) -> Post:
        await post.save()
        return post

    @staticmethod
    async def delete(post: Post) -> None:
        post.is_deleted = True
        await post.save()

    @staticmethod
    async def search_posts(
        query: str,
        post_type: str | None = None,
        hashtags: list[str] | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Post], int]:
        filters: dict[str, Any] = {"is_deleted": False, "visibility": "public"}

        if post_type:
            filters["post_type"] = post_type

        if hashtags:
            filters["hashtags"] = {"$in": hashtags}

        if query:
            query_lower = query.lower().strip()
            filters["$or"] = [
                {"content": {"$regex": query_lower, "$options": "i"}},
                {"hashtags": {"$in": [query_lower]}},
                {"search_keywords": {"$in": [query_lower]}},
            ]

        total = await Post.find(filters).count()
        skip = (page - 1) * per_page
        posts = await Post.find(filters).skip(skip).limit(per_page).sort("-created_at").to_list()

        return posts, total

    @staticmethod
    async def get_feed(
        page: int = 1,
        per_page: int = 20,
        post_type: str | None = None,
    ) -> list[Post]:
        filters: dict[str, Any] = {"is_deleted": False, "visibility": "public"}

        if post_type:
            filters["post_type"] = post_type

        skip = (page - 1) * per_page
        return await Post.find(filters).skip(skip).limit(per_page).sort("-created_at").to_list()

    @staticmethod
    async def get_user_posts(
        user_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> list[Post]:
        skip = (page - 1) * per_page
        return await Post.find(
            Post.author_id == user_id, Post.is_deleted == False
        ).skip(skip).limit(per_page).sort("-created_at").to_list()

    @staticmethod
    async def count_by_author(author_id: str) -> int:
        return await Post.find(Post.author_id == author_id, Post.is_deleted == False).count()
