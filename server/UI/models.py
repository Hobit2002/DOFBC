from django.db import models

# Create your models here.
from django.db import models
import uuid

from django.db.models.deletion import CASCADE

class Area(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.TextField(max_length=100)

    def __str__(self):
        return super().__str__() + ":Area:" + self.name

class appUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    loginname = models.TextField(max_length=60,unique=True)
    name = models.TextField(max_length=60)
    hash = models.TextField(max_length=80)
    areas = models.ManyToManyField(Area)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return super().__str__() + ":U:" + self.loginname

statusChoices = (('W','Waiting'),('A','Activated'),('C','Closed'))

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.TextField(max_length=100)
    area = models.ForeignKey('Area', on_delete=models.CASCADE, null=True)
    status = models.CharField(max_length=1,choices=statusChoices,default='W')

    def __str__(self):
        return super().__str__() + ":FB:" + self.name

class Form(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.TextField(max_length=100)
    jsonQuestions = models.TextField(max_length=1000)

    def __str__(self):
        return super().__str__() + ":Form:" + self.name
