from django.contrib import admin
from .models import Assessment, Marks

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'assessment_type', 'max_marks', 'date')
    list_filter = ('subject__college', 'assessment_type', 'date')
    search_fields = ('name', 'subject__name')

@admin.register(Marks)
class MarksAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'student', 'marks_obtained')
    list_filter = ('assessment__subject', 'assessment__assessment_type')
    search_fields = ('student__user__first_name', 'student__user__registration_number')
