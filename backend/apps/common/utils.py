import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF that returns structured error responses
    and logs exceptions.
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Log the exception
    logger.error(f"Exception: {str(exc)} in view {context['view'].__class__.__name__}", exc_info=True)

    if response is None:
        # It's an unhandled exception (500) or Django validation error not caught by DRF.
        return Response({
            "error": {
                "code": "server_error",
                "message": "An unexpected error occurred.",
                "details": str(exc)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Standardize error structure
    custom_data = {
        "error": {
            "code": getattr(exc, 'default_code', 'error'),
            "message": response.data.get('detail', 'A validation error occurred.') if isinstance(response.data, dict) else str(response.data),
            "details": response.data
        }
    }
    
    # Remove redundant detail from details if present
    if isinstance(custom_data['error']['details'], dict) and 'detail' in custom_data['error']['details']:
        del custom_data['error']['details']['detail']
        
    response.data = custom_data

    return response
