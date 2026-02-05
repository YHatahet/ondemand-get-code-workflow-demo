import asyncio
import time
import functools
import inspect


def retry(retries: int = 3, delay: float = 1.0, exceptions: tuple = (Exception,)):
    """
    Decorator that retries a function a specified number of times on failure.

    :param retries: Total number of retry attempts (default is 3).
    :param delay: Delay in seconds between attempts (default is 1.0).
    :param exceptions: A tuple of exceptions to catch (default is Exception).
    """

    def decorator(func):
        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def wrapper(*args, **kwargs):
                for attempt in range(retries + 1):
                    try:
                        return await func(*args, **kwargs)
                    except exceptions as e:
                        if attempt >= retries:
                            raise e
                        await asyncio.sleep(delay)

            return wrapper
        else:

            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                for attempt in range(retries + 1):
                    try:
                        return func(*args, **kwargs)
                    except exceptions as e:
                        if attempt >= retries:
                            raise e
                        time.sleep(delay)

            return wrapper

    return decorator
