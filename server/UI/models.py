from django.db import models
from django.conf import settings
import uuid

statusChoices = (('W','Waiting'),('A','Activated'),('C','Closed'))

class Form(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.TextField(max_length=100)
    jsonQuestions = models.TextField(max_length=1000,default="{}")
    globalForm = models.BooleanField(default=False,db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL,models.CASCADE,null=True,default=None)

    def __str__(self):
        return super().__str__() + ":Form:" + self.name

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.TextField(max_length=100)
    user = models.ForeignKey(settings.AUTH_USER_MODEL,models.CASCADE,null=True,default=None)
    status = models.CharField(max_length=1,choices=statusChoices,default='W')
    form = models.ForeignKey(Form,models.CASCADE,null=True,default=None)
    jsonAnswers = models.TextField(max_length=1000,default="{}")

    def __str__(self):
        return super().__str__() + ":FB:" + self.name
