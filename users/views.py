from rest_framework.authentication import SessionAuthentication
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, LoginSerializer
from .utils import generate_otp
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect
from django.http import HttpResponse
from .tasks import send_otp_email
from django.views.generic import TemplateView
from users.models import User
from reports.models import Report
from claims.models import Claim

import redis
import json

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True
)

class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        otp = generate_otp()

        password_hash = make_password(
            data["password"]
        )

        signup_data = {
            "otp": otp,
            "full_name": data["full_name"],
            "phone": data["phone"],
            "password_hash": password_hash,
        }

        redis_key = f"signup:{data['email']}"

        redis_client.setex(
            redis_key,
            300,
            json.dumps(signup_data)
        )
        send_otp_email.delay(
            data["email"],
            otp
        )


        return Response(
            {
                "message": "OTP sent successfully"
            },
            status=status.HTTP_200_OK
        )

class VerifyOTPView(APIView):

    def post(self, request):

        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {
                    "error": "Email and OTP are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        redis_key = f"signup:{email}"

        signup_data = redis_client.get(redis_key)

        if not signup_data:
            return Response(
                {
                    "error": "No OTP verification found or OTP has expired"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        signup_data = json.loads(signup_data)

        if signup_data["otp"] != otp:
            return Response(
                {
                    "error": "Invalid OTP"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create(
            email=email,
            full_name=signup_data["full_name"],
            phone=signup_data["phone"],
            password=signup_data["password_hash"],
            status="active"
        )

        redis_client.delete(redis_key)

        return Response(
            {
                "message": "Email verified and account created successfully",
                "user_id": user.id,
                "email": user.email
            },
            status=status.HTTP_201_CREATED
        )


class ResendOTPView(APIView):

    def post(self, request):

        email = request.data.get("email")

        if not email:
            return Response(
                {
                    "error": "Email is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        redis_key = f"signup:{email}"

        signup_data = redis_client.get(redis_key)

        if not signup_data:
            return Response(
                {
                    "error": "Signup session expired. Please register again."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        signup_data = json.loads(signup_data)

        new_otp = generate_otp()

        signup_data["otp"] = new_otp

        redis_client.setex(
            redis_key,
            300,
            json.dumps(signup_data)
        )

        send_otp_email.delay(
            email,
            new_otp
        )

        return Response(
            {
                "message": "New OTP sent successfully"
            },
            status=status.HTTP_200_OK
        )

class LoginView(APIView):

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "full_name": user.full_name,
                        "email": user.email,
                        "is_superuser": user.is_superuser,
                    }
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class GoogleLoginSuccessView(APIView):

    authentication_classes = [
        SessionAuthentication
    ]

    def get(self, request):

        if not request.user.is_authenticated:
            return Response(
                {
                    "error": "Google authentication failed"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = request.user

        refresh = RefreshToken.for_user(user)

        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Login</title>
        </head>
        <body>

        <script>
            localStorage.setItem(
                "access_token",
                "{access_token}"
            );

            localStorage.setItem(
                "refresh_token",
                "{refresh_token}"
            );

            localStorage.setItem(
                "user",
                JSON.stringify({{
                    "id": {user.id},
                    "full_name": "{user.full_name}",
                    "email": "{user.email}"
                }})
            );

            window.location.href = "/dashboard/";
        </script>

        </body>
        </html>
        """

        return HttpResponse(html)

class UserMeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        return Response(
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "location": user.location,
                "profile_photo": user.profile_photo,
                "is_superuser": user.is_superuser,
            },
            status=status.HTTP_200_OK
        )

class AdminDashboardView(TemplateView):
    template_name = "admin_dashboard.html"


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if not request.user.is_superuser:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        total_reports = Report.objects.count()

        active_users = User.objects.filter(
            status="active"
        ).count()

        verification_queue = Claim.objects.filter(
            status="pending"
        ).count()

        resolved_reports = Report.objects.filter(
            status__in=["returned", "closed"]
        ).count()

        if total_reports > 0:
            success_rate = round(
                (resolved_reports / total_reports) * 100,
                1
            )
        else:
            success_rate = 0

        return Response(
            {
                "total_reports": total_reports,
                "active_users": active_users,
                "verification_queue": verification_queue,
                "success_rate": success_rate
            },
            status=status.HTTP_200_OK
        )