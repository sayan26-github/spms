from django.contrib import admin
from .models import ClassSession, Attendance

@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ('subject', 'date', 'created_by')
    list_filter = ('subject__college', 'date')
    search_fields = ('subject__name', 'subject__code')
    date_hierarchy = 'date'

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('class_session', 'student', 'status')
    list_filter = ('status', 'class_session__date', 'class_session__subject')
    search_fields = ('student__user__first_name', 'student__user__registration_number')
