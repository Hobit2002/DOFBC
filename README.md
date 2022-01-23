# Distributed-offline-feedback-collector
## Startup
prerequisities: git,python(>3.7),pip,local sql server (running on port 3306) 
1. run "git clone https://github.com/Hobit2002/DOFBC"
2. run "pip install django django-cors-headers"
3. run "python -m pip install qrcode"
4. open your local database and create:
* database DOFBC
* new user DOFBC, which has permission not only to edit content of tables but also to create, delete and alter them. The password has to be same as the one in the server/settings.py file
* if you administer deployment program instance, change the database password as well as the secret key.
5. run "python manage.py makemigrations" and "python manage.py migrate"
6. run "python manage.py runserver"
7. the webapp is now accessible on localhost:8000