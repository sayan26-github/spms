from django.contrib import admin
from .models import College, Subject, Student, Teacher, Enrollment

@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'contact_email')
    search_fields = ('name', 'code')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'semester', 'college', 'teacher')
    list_filter = ('college', 'semester')
    search_fields = ('name', 'code')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('user', 'semester', 'batch')
    search_fields = ('user__first_name', 'user__last_name', 'user__registration_number')

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'designation')
    search_fields = ('user__first_name', 'user__last_name', 'user__registration_number')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'is_active')
    list_filter = ('subject__college', 'is_active')
