from django.contrib import admin
from .models import Application, ApplicationChecklist

class ApplicationChecklistInline(admin.TabularInline):
    model = ApplicationChecklist
    extra = 1

class ApplicationAdmin(admin.ModelAdmin):
    inlines = [ApplicationChecklistInline]

admin.site.register(Application, ApplicationAdmin)
admin.site.register(ApplicationChecklist)
