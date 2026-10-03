import asyncio
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)

_background_tasks_enabled = True
_task_queue: list[Callable] = []


def schedule_task(task_func: Callable, *args: Any, **kwargs: Any) -> None:
    if not _background_tasks_enabled:
        return
    _task_queue.append(lambda: task_func(*args, **kwargs))
    logger.info("Task scheduled: %s", task_func.__name__)


async def process_background_tasks() -> None:
    from app.tasks.celery_tasks import expire_jobs_task, expire_otps_task, send_event_reminders_task
    task_interval = 0
    periodic_interval = 3600

    while _background_tasks_enabled:
        if _task_queue:
            task = _task_queue.pop(0)
            try:
                result = task()
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                logger.exception("Background task failed")

        task_interval += 1
        if task_interval >= periodic_interval:
            task_interval = 0
            try:
                expire_jobs_task()
                expire_otps_task()
                send_event_reminders_task()
            except Exception:
                logger.exception("Periodic tasks failed")

        await asyncio.sleep(1)
