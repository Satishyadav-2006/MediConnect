import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.post import PostCreateRequest, PostUpdateRequest, CommentCreateRequest, ReactionRequest
from app.models.base import PostType, Visibility, ReactionType


def _make_post(**overrides):
    p = MagicMock()
    p.post_id = overrides.get("post_id", "post-1")
    p.author_id = overrides.get("author_id", "user-1")
    p.content = overrides.get("content", "Test content")
    p.post_type = MagicMock(value="text")
    p.visibility = MagicMock(value="public")
    p.is_deleted = False
    p.is_edited = False
    p.reaction_count = 0
    p.comment_count = 0
    p.share_count = 0
    p.bookmark_count = 0
    p.view_count = 0
    p.media = []
    p.hashtags = []
    p.mentions = []
    p.location = ""
    p.organization_id = None
    p.created_at = datetime.now(timezone.utc)
    p.updated_at = datetime.now(timezone.utc)
    p.save = AsyncMock()
    return p


class TestCreatePost:
    @pytest.mark.asyncio
    async def test_create_post(self):
        from app.services.post_service import PostService
        data = PostCreateRequest(content="Hello world")
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.UserRepository") as repo, \
             patch("app.services.post_service.sanitize_string", side_effect=lambda x: x):
            mock_p = MagicMock()
            mock_p.insert = AsyncMock()
            mock_p.post_id = "new-post"
            MockPost.side_effect = lambda **kw: mock_p
            user = MagicMock()
            user.posts_count = 0
            user.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await PostService.create_post("user-1", data)
            assert "post_id" in result
            assert result["message"] == "Post created successfully"


class TestGetPost:
    @pytest.mark.asyncio
    async def test_get_post(self):
        from app.services.post_service import PostService
        post = _make_post()
        with patch("app.services.post_service.Post") as MockPost:
            MockPost.find_one = AsyncMock(return_value=post)
            result = await PostService.get_post("post-1")
            assert result["post_id"] == "post-1"

    @pytest.mark.asyncio
    async def test_get_post_not_found(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.Post") as MockPost:
            MockPost.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await PostService.get_post("missing")


class TestUpdatePost:
    @pytest.mark.asyncio
    async def test_update_post(self):
        from app.services.post_service import PostService
        post = _make_post(author_id="user-1")
        data = PostUpdateRequest(content="Updated content")
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.sanitize_string", side_effect=lambda x: x), \
             patch("app.services.post_service.extract_hashtags", return_value=[]), \
             patch("app.services.post_service.extract_mentions", return_value=[]):
            MockPost.find_one = AsyncMock(return_value=post)
            result = await PostService.update_post("post-1", "user-1", data)
            assert result["message"] == "Post updated successfully"

    @pytest.mark.asyncio
    async def test_update_post_wrong_author(self):
        from app.services.post_service import PostService
        post = _make_post(author_id="user-1")
        data = PostUpdateRequest(content="Hacked")
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.sanitize_string", side_effect=lambda x: x):
            MockPost.find_one = AsyncMock(return_value=post)
            with pytest.raises(AuthorizationError):
                await PostService.update_post("post-1", "user-2", data)


class TestDeletePost:
    @pytest.mark.asyncio
    async def test_delete_post(self):
        from app.services.post_service import PostService
        post = _make_post(author_id="user-1")
        with patch("app.services.post_service.Post") as MockPost:
            MockPost.find_one = AsyncMock(return_value=post)
            result = await PostService.delete_post("post-1", "user-1")
            assert result["message"] == "Post deleted successfully"

    @pytest.mark.asyncio
    async def test_delete_post_wrong_author(self):
        from app.services.post_service import PostService
        post = _make_post(author_id="user-1")
        with patch("app.services.post_service.Post") as MockPost:
            MockPost.find_one = AsyncMock(return_value=post)
            with pytest.raises(AuthorizationError):
                await PostService.delete_post("post-1", "user-2")


class TestLikeUnlike:
    @pytest.mark.asyncio
    async def test_like_post(self):
        from app.services.post_service import PostService
        post = _make_post()
        data = ReactionRequest(reaction_type="like")
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.Reaction") as MockReaction, \
             patch("app.services.post_service.notify_post_reacted", new_callable=AsyncMock):
            MockPost.find_one = AsyncMock(return_value=post)
            MockReaction.find_one = AsyncMock(return_value=None)
            mock_r = MagicMock()
            mock_r.insert = AsyncMock()
            MockReaction.side_effect = lambda **kw: mock_r
            result = await PostService.react_to_post("post-1", "user-2", data)
            assert result["message"] == "Reaction added"

    @pytest.mark.asyncio
    async def test_unlike_post(self):
        from app.services.post_service import PostService
        post = _make_post()
        reaction = MagicMock()
        reaction.delete = AsyncMock()
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.Reaction") as MockReaction:
            MockReaction.find_one = AsyncMock(return_value=reaction)
            MockPost.find_one = AsyncMock(return_value=post)
            result = await PostService.remove_reaction("post-1", "user-2")
            assert result["message"] == "Reaction removed"

    @pytest.mark.asyncio
    async def test_unlike_not_found(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.Reaction") as MockReaction:
            MockReaction.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await PostService.remove_reaction("post-1", "user-2")


class TestBookmark:
    @pytest.mark.asyncio
    async def test_bookmark_post(self):
        from app.services.post_service import PostService
        post = _make_post()
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.Bookmark") as MockBM:
            MockBM.find_one = AsyncMock(return_value=None)
            mock_bm = MagicMock()
            mock_bm.insert = AsyncMock()
            MockBM.side_effect = lambda **kw: mock_bm
            MockPost.find_one = AsyncMock(return_value=post)
            result = await PostService.bookmark_post("post-1", "user-1")
            assert result["message"] == "Post bookmarked"

    @pytest.mark.asyncio
    async def test_unbookmark_post(self):
        from app.services.post_service import PostService
        post = _make_post()
        bm = MagicMock()
        bm.delete = AsyncMock()
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.Bookmark") as MockBM:
            MockBM.find_one = AsyncMock(return_value=bm)
            MockPost.find_one = AsyncMock(return_value=post)
            result = await PostService.remove_bookmark("post-1", "user-1")
            assert result["message"] == "Bookmark removed"


class TestAddComment:
    @pytest.mark.asyncio
    async def test_create_comment(self):
        from app.services.post_service import PostService
        post = _make_post()
        data = CommentCreateRequest(content="Nice post!")
        with patch("app.services.post_service.Post") as MockPost, \
             patch("app.services.post_service.Comment") as MockComment, \
             patch("app.services.post_service.sanitize_string", side_effect=lambda x: x), \
             patch("app.services.post_service.extract_mentions", return_value=[]), \
             patch("app.services.post_service.notify_post_commented", new_callable=AsyncMock):
            MockPost.find_one = AsyncMock(return_value=post)
            mock_c = MagicMock()
            mock_c.insert = AsyncMock()
            mock_c.comment_id = "comment-1"
            MockComment.side_effect = lambda **kw: mock_c
            result = await PostService.add_comment("post-1", "user-2", data)
            assert "comment_id" in result


class TestFeed:
    @pytest.mark.asyncio
    async def test_get_feed(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.Post") as MockPost:
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockPost.find = MagicMock(return_value=mock_q)
            result = await PostService.get_feed("user-1")
            assert "items" in result
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_feed_trending_delegates_to_ranked(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.PostService.get_feed_ranked", new_callable=AsyncMock) as mock_ranked:
            mock_ranked.return_value = {"items": [], "total": 0, "page": 1, "per_page": 20}
            result = await PostService.get_feed("user-1", feed_type="trending")
            mock_ranked.assert_awaited_once_with("user-1", 1, 20)
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_feed_connections_empty_when_no_peers(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.PostService._connection_user_ids", new_callable=AsyncMock) as mock_peers:
            mock_peers.return_value = []
            result = await PostService.get_feed("user-1", feed_type="connections")
            assert result["items"] == []
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_feed_connections(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.PostService._connection_user_ids", new_callable=AsyncMock) as mock_peers, \
             patch("app.services.post_service.Post") as MockPost:
            mock_peers.return_value = ["user-2", "user-3"]
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockPost.find = MagicMock(return_value=mock_q)
            result = await PostService.get_feed("user-1", feed_type="connections")
            assert result["total"] == 0
            assert MockPost.find.called

    @pytest.mark.asyncio
    async def test_get_feed_organizations_empty_when_no_approved(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.PostService._approved_organization_ids", new_callable=AsyncMock) as mock_orgs:
            mock_orgs.return_value = []
            result = await PostService.get_feed("user-1", feed_type="organizations")
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_feed_organizations(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.PostService._approved_organization_ids", new_callable=AsyncMock) as mock_orgs, \
             patch("app.services.post_service.Post") as MockPost:
            mock_orgs.return_value = ["org-1"]
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockPost.find = MagicMock(return_value=mock_q)
            result = await PostService.get_feed("user-1", feed_type="organizations")
            assert result["total"] == 0
            assert MockPost.find.called

    @pytest.mark.asyncio
    async def test_get_feed_research(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.Post") as MockPost:
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockPost.find = MagicMock(return_value=mock_q)
            result = await PostService.get_feed("user-1", feed_type="research")
            assert result["total"] == 0
            assert MockPost.find.called

    @pytest.mark.asyncio
    async def test_get_feed_latest_default(self):
        from app.services.post_service import PostService
        with patch("app.services.post_service.Post") as MockPost:
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockPost.find = MagicMock(return_value=mock_q)
            result = await PostService.get_feed("user-1", feed_type="latest")
            assert result["total"] == 0
            assert MockPost.find.called
