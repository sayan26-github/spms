
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF that returns structured error responses.
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If response is None, it means it's an unhandled exception (500)
    # or a Django validation error not caught by DRF.
    if response is None:
        return None

    # Standardize error structure: {"detail": "Error message", "code": "error_code"}
    # By default DRF returns specific field errors or a "detail" key.
    
    # Example customization:
    # if response.status_code == 403:
    #     response.data['detail'] = "You do not have permission to perform this action."

    return response
