import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF that logs exceptions
    and returns structured error responses.
    Preserves DRF's native format so the frontend can read
    `error.response.data.detail` directly.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Log the exception
    logger.error(
        f"Exception: {str(exc)} in view "
        f"{context['view'].__class__.__name__}",
        exc_info=True,
    )

    if response is None:
        # Unhandled exception (500)
        return Response(
            {"detail": "An unexpected error occurred."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Return the standard DRF response as-is (contains 'detail' key)
    return response

