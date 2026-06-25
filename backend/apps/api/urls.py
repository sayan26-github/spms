from django.urls import path, include

urlpatterns = [
    # Auth & Users
    path('auth/', include('apps.users.urls')),
    
    # Core Academics
    path('academics/', include('apps.academics.urls')),
    
    # Attendance
    path('attendance/', include('apps.attendance.urls')),
    
    # Assessments
    path('assessments/', include('apps.assessments.urls')),
    
    # Analytics
    path('analytics/', include('apps.analytics.urls')),
    
    # Communication
    path('communication/', include('apps.communication.urls')),
    
    # Placements
    path('placements/', include('apps.placements.urls')),
]
