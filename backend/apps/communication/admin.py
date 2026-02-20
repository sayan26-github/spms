from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'receiver', 'timestamp', 'is_read', 'college')
    list_filter = ('is_read', 'college', 'timestamp')
    search_fields = ('subject', 'body', 'sender__first_name', 'sender__last_name', 'receiver__first_name', 'receiver__last_name')
    readonly_fields = ('timestamp',)
