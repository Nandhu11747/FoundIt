from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(
            email,
            password,
            **extra_fields
        )


class User(AbstractBaseUser, PermissionsMixin):

    id = models.BigAutoField(primary_key=True)

    full_name = models.CharField(max_length=150)

    email = models.EmailField(unique=True)

    phone = models.CharField(max_length=20, unique=True, blank=True, null=True )

    profile_photo = models.URLField(
        max_length=500,
        blank=True,
        null=True
    )

    location = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        default="active"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["full_name", "phone"]

    def __str__(self):
        return self.email

class EmailVerification(models.Model):

    email = models.EmailField()

    otp = models.CharField(max_length=6)

    full_name = models.CharField(max_length=150)

    phone = models.CharField(max_length=20)

    password_hash = models.CharField(max_length=128)

    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.email