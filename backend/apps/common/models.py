from django.db import models
from django.utils.translation import gettext_lazy as _

from django.utils import timezone

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    'created_at' and 'updated_at' fields, and soft deletion.
    """
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        db_index=True,
        help_text=_('Time when the record was created.')
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
        help_text=_('Time when the record was last updated.')
    )
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.deleted_at = timezone.now()  # type: ignore
        self.save(update_fields=['is_deleted', 'deleted_at'])  # type: ignore

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
